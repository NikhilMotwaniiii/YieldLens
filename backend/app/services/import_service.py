from decimal import Decimal
from io import BytesIO

import pandas as pd
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Bond, PortfolioPosition
from app.schemas.bond import ManualBondCreate
from app.schemas.imports import ImportErrorItem, ImportResult
from app.schemas.position import PositionCreate
from app.services.bond_search_service import BondSearchService
from app.utils.isin import normalize_isin


class ImportService:
    REQUIRED_COLUMNS = {
        "isin",
        "issuer",
        "security_name",
        "coupon_rate",
        "maturity_date",
        "face_value",
        "quantity",
    }

    def __init__(self, db: Session, bond_service: BondSearchService) -> None:
        self.db = db
        self.bond_service = bond_service

    async def import_csv(self, portfolio_id: int, contents: bytes) -> ImportResult:
        errors: list[ImportErrorItem] = []
        try:
            dataframe = pd.read_csv(BytesIO(contents), keep_default_na=False)
        except Exception:
            return ImportResult(
                valid_rows=0,
                invalid_rows=0,
                imported_rows=0,
                errors=[ImportErrorItem(row=0, field="file", message="Unable to parse CSV file")],
            )

        dataframe.columns = [str(column).strip().lower() for column in dataframe.columns]
        missing = sorted(self.REQUIRED_COLUMNS - set(dataframe.columns))
        if missing:
            return ImportResult(
                valid_rows=0,
                invalid_rows=len(dataframe.index),
                imported_rows=0,
                errors=[
                    ImportErrorItem(row=0, field="headers", message=f"Missing required columns: {', '.join(missing)}")
                ],
            )

        seen: set[str] = set()
        valid_rows: list[PositionCreate] = []
        valid_indexes: list[int] = []
        existing_isins = {
            row[0]
            for row in self.db.query(Bond.isin)
            .join(PortfolioPosition, PortfolioPosition.bond_id == Bond.id)
            .filter(PortfolioPosition.portfolio_id == portfolio_id)
            .all()
        }

        for index, row in dataframe.iterrows():
            row_number = int(index) + 2
            isin = normalize_isin(str(row.get("isin", "")))
            if isin in seen:
                errors.append(ImportErrorItem(row=row_number, field="isin", message="Duplicate row in CSV"))
                continue
            if isin in existing_isins:
                errors.append(ImportErrorItem(row=row_number, field="isin", message="Bond already exists in portfolio"))
                continue
            seen.add(isin)
            try:
                bond = ManualBondCreate(
                    isin=isin,
                    issuer=str(row["issuer"]).strip(),
                    security_name=str(row["security_name"]).strip(),
                    coupon_rate=self._decimal(row["coupon_rate"]),
                    maturity_date=str(row["maturity_date"]).strip(),
                    face_value=self._decimal(row["face_value"]),
                    credit_rating=self._optional_str(row.get("rating")),
                    sector=self._optional_str(row.get("sector")),
                    bond_type=self._optional_str(row.get("bond_type")) or "Manual CSV",
                    duration=self._optional_decimal(row.get("duration")),
                    latest_price=self._optional_decimal(row.get("current_price")),
                    latest_yield=self._optional_decimal(row.get("yield")),
                    price_source="CSV manual reference price" if self._optional_decimal(row.get("current_price")) is not None else None,
                    provider_name="CSV Import",
                    provider_identifier=isin,
                )
                valid_rows.append(
                    PositionCreate(
                        bond=bond,
                        quantity=self._decimal(row["quantity"]),
                        purchase_price=self._optional_decimal(row.get("purchase_price")),
                        purchase_date=self._optional_str(row.get("purchase_date")),
                        manual_current_price=None,
                    )
                )
                valid_indexes.append(row_number)
            except (ValidationError, ValueError) as exc:
                field = "row"
                message = str(exc)
                if isinstance(exc, ValidationError) and exc.errors():
                    first = exc.errors()[0]
                    field = str(first.get("loc", ["row"])[0])
                    message = str(first.get("msg", message))
                errors.append(ImportErrorItem(row=row_number, field=field, message=message))

        imported = 0
        for row_number, payload in zip(valid_indexes, valid_rows, strict=True):
            try:
                bond = self.bond_service.upsert_bond(payload.bond)  # type: ignore[arg-type]
                self.db.add(
                    PortfolioPosition(
                        portfolio_id=portfolio_id,
                        bond_id=bond.id,
                        quantity=payload.quantity,
                        purchase_price=payload.purchase_price,
                        purchase_date=payload.purchase_date,
                        manual_current_price=payload.manual_current_price,
                    )
                )
                self.db.commit()
                imported += 1
            except IntegrityError:
                self.db.rollback()
                errors.append(ImportErrorItem(row=row_number, field="isin", message="Bond already exists in portfolio"))

        return ImportResult(
            valid_rows=len(valid_rows),
            invalid_rows=len(errors),
            imported_rows=imported,
            errors=errors,
        )

    @staticmethod
    def _optional_str(value: object) -> str | None:
        text = "" if value is None else str(value).strip()
        return text or None

    @staticmethod
    def _decimal(value: object) -> Decimal:
        return Decimal(str(value).strip())

    @classmethod
    def _optional_decimal(cls, value: object) -> Decimal | None:
        text = cls._optional_str(value)
        return Decimal(text) if text is not None else None


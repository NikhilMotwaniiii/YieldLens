from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import PlainTextResponse

from app.api.dependencies import get_import_service
from app.core.exceptions import AppError
from app.schemas.imports import ImportResult
from app.services.import_service import ImportService

router = APIRouter(prefix="/portfolios/{portfolio_id}/import", tags=["imports"])


@router.post("", response_model=ImportResult)
async def import_positions(
    portfolio_id: int,
    file: UploadFile = File(...),
    service: ImportService = Depends(get_import_service),
) -> ImportResult:
    if file.content_type not in {"text/csv", "application/vnd.ms-excel", "application/octet-stream"}:
        raise AppError("Only CSV uploads are supported", status_code=415, code="unsupported_file_type")
    contents = await file.read()
    if len(contents) > 1_000_000:
        raise AppError("CSV file is too large for the MVP importer", status_code=413, code="file_too_large")
    return await service.import_csv(portfolio_id, contents)


@router.get("/template", response_class=PlainTextResponse)
def csv_template() -> str:
    return (
        "isin,issuer,security_name,coupon_rate,maturity_date,face_value,quantity,"
        "purchase_price,current_price,duration,rating,sector\n"
        "INE001A08024,HDFC Bank Limited,HDFC Bank 7.95% 2031 Senior Bond,7.95,"
        "2031-08-15,1000,100,1002,1018.5,4.62,AAA,Financial Services\n"
    )


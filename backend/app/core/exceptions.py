from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError


class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400, code: str = "bad_request") -> None:
        self.message = message
        self.status_code = status_code
        self.code = code


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message}},
        )

    @app.exception_handler(ValidationError)
    async def validation_error_handler(_: Request, exc: ValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={"error": {"code": "validation_error", "message": "Invalid data", "details": exc.errors()}},
        )


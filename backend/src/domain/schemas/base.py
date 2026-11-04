from pydantic import BaseModel


class ListPagination(BaseModel):
    page: int = 1
    per_page: int = 10
    
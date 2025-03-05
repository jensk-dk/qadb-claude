from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import datetime
from app.models.base import (
    TestSuiteBase, TestRunTemplateBase, TestCaseBase,
    CompanyBase, TestOperatorBase, TestCaseResultBase,
    TestRunBase, SpecificationBase, RequirementBase,
    CapabilityBase, DUTBase
)


# TestSuite schemas
class TestSuiteCreate(TestSuiteBase):
    pass


class TestSuiteUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    format: Optional[str] = None
    version: Optional[int] = None
    version_string: Optional[str] = None
    is_final: Optional[bool] = None


class TestSuiteRead(TestSuiteBase):
    id: int

    class Config:
        orm_mode = True


# TestRunTemplate schemas
class TestRunTemplateCreate(TestRunTemplateBase):
    pass


class TestRunTemplateUpdate(BaseModel):
    template_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    field: Optional[str] = None


class TestRunTemplateRead(TestRunTemplateBase):
    id: int

    class Config:
        orm_mode = True


class TestRunTemplateWithCases(TestRunTemplateRead):
    test_cases: List[Any] = []


# TestCase schemas
class TestCaseCreate(TestCaseBase):
    test_suite_id: int


class TestCaseUpdate(BaseModel):
    case_id: Optional[str] = None
    title: Optional[str] = None
    version: Optional[int] = None
    version_string: Optional[str] = None
    description: Optional[str] = None
    steps: Optional[str] = None
    precondition: Optional[str] = None
    area: Optional[str] = None
    automatability: Optional[str] = None
    author: Optional[str] = None
    material: Optional[str] = None
    is_challenged: Optional[bool] = None
    challenge_issue_url: Optional[str] = None
    applies_to: Optional[str] = None
    test_suite_id: Optional[int] = None


class TestCaseRead(TestCaseBase):
    id: int
    test_suite_id: Optional[int] = None

    class Config:
        orm_mode = True


class TestCaseWithSuite(TestCaseRead):
    test_suite: Optional[TestSuiteRead] = None


# Company schemas
class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    field: Optional[str] = None
    access_rights: Optional[str] = None


class CompanyRead(CompanyBase):
    id: int

    class Config:
        orm_mode = True


# TestOperator schemas
class TestOperatorCreate(TestOperatorBase):
    company_id: Optional[int] = None
    password: str


class TestOperatorUpdate(BaseModel):
    name: Optional[str] = None
    mail: Optional[str] = None
    login: Optional[str] = None
    access_rights: Optional[str] = None
    company_id: Optional[int] = None
    password: Optional[str] = None


class TestOperatorRead(TestOperatorBase):
    id: int
    company_id: Optional[int] = None

    class Config:
        orm_mode = True


class TestOperatorWithCompany(TestOperatorRead):
    company: Optional[CompanyRead] = None


# TestCaseResult schemas
class TestCaseResultCreate(TestCaseResultBase):
    test_case_id: int
    test_run_id: Optional[int] = None


class TestCaseResultUpdate(BaseModel):
    result: Optional[str] = None
    logs: Optional[str] = None
    comment: Optional[str] = None
    artifacts: Optional[str] = None
    test_case_id: Optional[int] = None
    test_run_id: Optional[int] = None


class TestCaseResultRead(TestCaseResultBase):
    id: int
    test_case_id: int
    test_run_id: Optional[int] = None

    class Config:
        orm_mode = True


class TestCaseResultWithDetails(TestCaseResultRead):
    test_case: Optional[TestCaseRead] = None


# TestRun schemas
class TestRunCreate(TestRunBase):
    operator_id: int
    test_case_results: Optional[List[TestCaseResultCreate]] = None


class TestRunUpdate(BaseModel):
    status: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    run_date: Optional[str] = None
    dut_id: Optional[int] = None
    operator_id: Optional[int] = None


class TestRunRead(TestRunBase):
    id: int
    operator_id: int

    class Config:
        orm_mode = True


class TestRunWithResults(TestRunRead):
    test_case_results: List[TestCaseResultRead] = []
    operator: Optional[TestOperatorRead] = None


# Specification schemas
class SpecificationCreate(SpecificationBase):
    pass


class SpecificationUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    version: Optional[str] = None


class SpecificationRead(SpecificationBase):
    id: int

    class Config:
        orm_mode = True


# Requirement schemas
class RequirementCreate(RequirementBase):
    pass


class RequirementUpdate(BaseModel):
    field: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None


class RequirementRead(RequirementBase):
    id: int

    class Config:
        orm_mode = True


class RequirementWithSpecifications(RequirementRead):
    specifications: List[SpecificationRead] = []


# Capability schemas
class CapabilityCreate(CapabilityBase):
    pass


class CapabilityUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    version: Optional[int] = None
    version_string: Optional[str] = None


class CapabilityRead(CapabilityBase):
    id: int

    class Config:
        orm_mode = True


# DUT schemas
class DUTCreate(DUTBase):
    pass


class DUTUpdate(BaseModel):
    product_name: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    countries: Optional[str] = None
    parent: Optional[str] = None


class DUTRead(DUTBase):
    id: int

    class Config:
        orm_mode = True


class DUTWithCapabilities(DUTRead):
    capabilities: List[CapabilityRead] = []


# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# File Upload schemas
class FileUploadResponse(BaseModel):
    filename: str
    success: bool
    message: str


# Common response schemas
class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
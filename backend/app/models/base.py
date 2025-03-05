from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship


class TestSuiteBase(SQLModel):
    name: str
    url: Optional[str] = None
    format: str
    version: int
    version_string: str
    is_final: bool = False


class TestSuite(TestSuiteBase, table=True):
    __tablename__ = "test_suites"

    id: Optional[int] = Field(default=None, primary_key=True, alias="TestSuite_ID")
    test_cases: List["TestCase"] = Relationship(back_populates="test_suite")


class TestRunTemplateBase(SQLModel):
    template_id: str = Field(alias="Id")
    name: str
    description: Optional[str] = None
    field: Optional[str] = Field(default=None, alias="Field")


class TestRunTemplate(TestRunTemplateBase, table=True):
    __tablename__ = "test_run_templates"

    id: Optional[int] = Field(default=None, primary_key=True, alias="TestRunTemplate_ID")
    test_cases: List["TestRunTemplateTestCase"] = Relationship(back_populates="template")


class TestCaseBase(SQLModel):
    case_id: str = Field(alias="Id")
    title: str
    version: int
    version_string: str
    description: Optional[str] = None
    steps: Optional[str] = None
    precondition: Optional[str] = None
    area: Optional[str] = None
    automatability: Optional[str] = None
    author: Optional[str] = None
    material: Optional[str] = None
    is_challenged: Optional[bool] = Field(default=False, alias="isChallenged")
    challenge_issue_url: Optional[str] = Field(default=None, alias="ChallengeIssueUrl")
    applies_to: Optional[str] = Field(default=None, alias="appliesTo")


class TestCase(TestCaseBase, table=True):
    __tablename__ = "test_cases"

    id: Optional[int] = Field(default=None, primary_key=True, alias="TestCase_ID")
    test_suite_id: Optional[int] = Field(default=None, foreign_key="test_suites.id")
    test_suite: Optional[TestSuite] = Relationship(back_populates="test_cases")
    
    template_links: List["TestRunTemplateTestCase"] = Relationship(back_populates="test_case")
    test_case_results: List["TestCaseResult"] = Relationship(back_populates="test_case")


class TestRunTemplateTestCase(SQLModel, table=True):
    __tablename__ = "test_run_template_test_cases"

    template_id: Optional[int] = Field(
        default=None, foreign_key="test_run_templates.id", primary_key=True
    )
    test_case_id: Optional[int] = Field(
        default=None, foreign_key="test_cases.id", primary_key=True
    )
    
    template: "TestRunTemplate" = Relationship(back_populates="test_cases")
    test_case: "TestCase" = Relationship(back_populates="template_links")


class CompanyBase(SQLModel):
    field: Optional[str] = Field(default=None, alias="Field")
    access_rights: Optional[str] = Field(default=None, alias="Access_Rights")


class Company(CompanyBase, table=True):
    __tablename__ = "companies"

    id: Optional[int] = Field(default=None, primary_key=True, alias="Company_ID")
    operators: List["TestOperator"] = Relationship(back_populates="company")


class TestOperatorBase(SQLModel):
    name: str
    mail: str
    login: str
    access_rights: str = Field(alias="Access_Rights")


class TestOperator(TestOperatorBase, table=True):
    __tablename__ = "test_operators"

    id: Optional[int] = Field(default=None, primary_key=True, alias="TestOperator_ID")
    company_id: Optional[int] = Field(default=None, foreign_key="companies.id")
    hashed_password: str
    company: Optional[Company] = Relationship(back_populates="operators")
    test_runs: List["TestRun"] = Relationship(back_populates="operator")


class TestCaseResultBase(SQLModel):
    result: str
    logs: Optional[str] = None
    comment: Optional[str] = None
    artifacts: Optional[str] = None


class TestCaseResult(TestCaseResultBase, table=True):
    __tablename__ = "test_case_results"

    id: Optional[int] = Field(default=None, primary_key=True, alias="TestCaseResult_ID")
    test_run_id: Optional[int] = Field(default=None, foreign_key="test_runs.id")
    test_run: Optional["TestRun"] = Relationship(back_populates="test_case_results")
    test_case_id: Optional[int] = Field(default=None, foreign_key="test_cases.id")
    test_case: Optional[TestCase] = Relationship(back_populates="test_case_results")


class TestRunBase(SQLModel):
    status: str
    name: Optional[str] = None
    description: Optional[str] = None
    run_date: Optional[str] = None
    dut_id: Optional[int] = None


class TestRun(TestRunBase, table=True):
    __tablename__ = "test_runs"

    id: Optional[int] = Field(default=None, primary_key=True, alias="TestRun_ID")
    operator_id: Optional[int] = Field(default=None, foreign_key="test_operators.id")
    operator: Optional[TestOperator] = Relationship(back_populates="test_runs")
    test_case_results: List[TestCaseResult] = Relationship(back_populates="test_run")


class SpecificationBase(SQLModel):
    name: str
    url: Optional[str] = None
    version: str


class Specification(SpecificationBase, table=True):
    __tablename__ = "specifications"

    id: Optional[int] = Field(default=None, primary_key=True, alias="Specification_ID")
    requirements: List["RequirementSpecification"] = Relationship(back_populates="specification")


class RequirementBase(SQLModel):
    field: Optional[str] = Field(default=None, alias="Field")
    name: Optional[str] = None
    description: Optional[str] = None


class Requirement(RequirementBase, table=True):
    __tablename__ = "requirements"

    id: Optional[int] = Field(default=None, primary_key=True, alias="Requirement_ID")
    specifications: List["RequirementSpecification"] = Relationship(back_populates="requirement")


class RequirementSpecification(SQLModel, table=True):
    __tablename__ = "requirement_specifications"

    requirement_id: Optional[int] = Field(
        default=None, foreign_key="requirements.id", primary_key=True
    )
    specification_id: Optional[int] = Field(
        default=None, foreign_key="specifications.id", primary_key=True
    )
    
    requirement: "Requirement" = Relationship(back_populates="specifications")
    specification: "Specification" = Relationship(back_populates="requirements")


class CapabilityBase(SQLModel):
    name: str
    category: str
    version: int
    version_string: str


class Capability(CapabilityBase, table=True):
    __tablename__ = "capabilities"

    id: Optional[int] = Field(default=None, primary_key=True, alias="Capability_ID")
    duts: List["DUTCapability"] = Relationship(back_populates="capability")


class DUTBase(SQLModel):
    product_name: str
    make: str
    model: str
    countries: Optional[str] = None
    parent: Optional[str] = None


class DUT(DUTBase, table=True):
    __tablename__ = "duts"

    id: Optional[int] = Field(default=None, primary_key=True, alias="Product_ID")
    capabilities: List["DUTCapability"] = Relationship(back_populates="dut")


class DUTCapability(SQLModel, table=True):
    __tablename__ = "dut_capabilities"

    dut_id: Optional[int] = Field(
        default=None, foreign_key="duts.id", primary_key=True
    )
    capability_id: Optional[int] = Field(
        default=None, foreign_key="capabilities.id", primary_key=True
    )
    
    dut: "DUT" = Relationship(back_populates="capabilities")
    capability: "Capability" = Relationship(back_populates="duts")
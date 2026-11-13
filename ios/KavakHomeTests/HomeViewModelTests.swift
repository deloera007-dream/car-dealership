import XCTest
@testable import KavakHome

@MainActor
final class HomeViewModelTests: XCTestCase {
    func testHomeHasExactlyTheFourRequestedFeatures() {
        XCTAssertEqual(HomeViewModel().features, [.buy, .sell, .garage, .financing])
    }

    func testEveryCardOpensItsMatchingTab() {
        let model = HomeViewModel()
        for feature in model.features {
            model.open(feature)
            XCTAssertEqual(model.selectedTab.feature, feature)
        }
    }

    func testEveryTabCanBeSelected() {
        let model = HomeViewModel()
        for tab in HomeTab.allCases {
            model.select(tab)
            XCTAssertEqual(model.selectedTab, tab)
        }
    }

    func testHomeCanBeSelectedAfterAnotherTab() {
        let model = HomeViewModel()
        model.select(.garage)
        model.select(.home)
        XCTAssertEqual(model.selectedTab, .home)
    }
}

@MainActor
final class CatalogViewModelTests: XCTestCase {
    func testInventoryHasEightUniqueVehiclesAndSixBrands() {
        XCTAssertEqual(SampleInventory.vehicles.count, 8)
        XCTAssertEqual(Set(SampleInventory.vehicles.map(\.id)).count, 8)
        XCTAssertEqual(SampleInventory.brands.count, 6)
    }

    func testSearchIsCaseInsensitiveAndTrimsWhitespace() {
        let model = CatalogViewModel()
        model.query = "  mAzDa  "
        XCTAssertEqual(model.vehicles.count, 2)
    }

    func testBrandAndPriceFiltersCombineAndReset() {
        let model = CatalogViewModel()
        model.brand = "Kia"
        model.priceFilter = .under300
        XCTAssertEqual(model.vehicles.map(\.model), ["Forte"])
        model.query = "Seltos"
        XCTAssertTrue(model.vehicles.isEmpty)
        model.reset()
        XCTAssertEqual(model.vehicles.count, 8)
    }
}

@MainActor
final class SellingTests: XCTestCase {
    private var validForm: SellingForm {
        SellingForm(brand: "Mazda", model: "3", year: 2022, trim: "Grand Touring", mileage: "35000")
    }

    func testIncompleteFormCannotProduceAQuote() {
        let model = SellViewModel()
        model.submit()
        XCTAssertNotNil(model.validationMessage)
        XCTAssertNil(model.result)
    }

    func testValidQuoteIsDeterministicAndOrdered() throws {
        let result = try XCTUnwrap(Valuation.estimate(validForm))
        XCTAssertEqual(result, Valuation.estimate(validForm))
        XCTAssertGreaterThan(result.lower, 0)
        XCTAssertGreaterThan(result.upper, result.lower)
    }

    func testOlderAgeAndHigherMileageReduceValuation() throws {
        let baseline = try XCTUnwrap(Valuation.estimate(validForm))
        var form = validForm
        form.year = 2015
        form.mileage = "200000"
        XCTAssertLessThan(try XCTUnwrap(Valuation.estimate(form)).upper, baseline.lower)
    }

    func testMileageBoundsAndInvalidNumbers() {
        for mileage in ["", "-1", "300001", "1.5", "35,000", "abc", "9999999999999999999999999999", "٣٥٠٠٠"] {
            var form = validForm
            form.mileage = mileage
            XCTAssertNil(Valuation.estimate(form), mileage)
        }
        for mileage in ["0", "300000"] {
            var form = validForm
            form.mileage = mileage
            XCTAssertNotNil(Valuation.estimate(form))
        }
    }

    func testYearVersionAndModelValidation() {
        var form = validForm
        form.year = 2027
        XCTAssertNotNil(form.validationMessage)
        form.year = 2022
        form.trim = "  "
        XCTAssertNotNil(form.validationMessage)
        form.trim = "GT"
        form.model = "Forte"
        XCTAssertNotNil(form.validationMessage)
    }

    func testEditsInvalidateQuoteAndChangingBrandClearsModel() {
        let model = SellViewModel()
        model.form = validForm
        model.submit()
        XCTAssertNotNil(model.result)
        model.form.mileage = "45000"
        XCTAssertNil(model.result)
        model.selectBrand("Kia")
        XCTAssertEqual(model.form.model, "")
        XCTAssertEqual(model.models, ["Forte", "Seltos"])
    }
}

@MainActor
final class FinancingTests: XCTestCase {
    func testStandardAmortization() throws {
        let result = try XCTUnwrap(LoanEstimate.calculate(price: 350_000, downPayment: 70_000, annualRate: 0.149, months: 36))
        XCTAssertEqual(result.principal, 280_000)
        let rate = 0.149 / 12
        let expected = 280_000 * rate / (1 - pow(1 + rate, -36))
        XCTAssertEqual(result.monthlyPayment, expected, accuracy: 0.001)
        XCTAssertEqual(result.totalPaid, result.monthlyPayment * 36 + 70_000, accuracy: 0.01)
    }

    func testZeroAndTinyInterestRemainFinite() throws {
        let zero = try XCTUnwrap(LoanEstimate.calculate(price: 120_000, downPayment: 0, annualRate: 0, months: 12))
        XCTAssertEqual(zero.monthlyPayment, 10_000)
        XCTAssertEqual(zero.interest, 0)
        let tiny = try XCTUnwrap(LoanEstimate.calculate(price: 120_000, downPayment: 0, annualRate: 1e-14, months: 12))
        XCTAssertEqual(tiny.monthlyPayment, 10_000, accuracy: 0.001)
    }

    func testFullDownPaymentHasNoLoanOrInterest() throws {
        let result = try XCTUnwrap(LoanEstimate.calculate(price: 300_000, downPayment: 300_000, annualRate: 0.149, months: 36))
        XCTAssertEqual(result.monthlyPayment, 0)
        XCTAssertEqual(result.totalPaid, 300_000)
    }

    func testInvalidLoanInputsAreRejected() {
        for price in [0, -1, 3_000_001, Double.infinity, Double.nan] {
            XCTAssertNil(LoanEstimate.calculate(price: price, downPayment: 0, annualRate: 0.149, months: 36))
        }
        for down in [-1, 400_000, Double.nan] {
            XCTAssertNil(LoanEstimate.calculate(price: 350_000, downPayment: down, annualRate: 0.149, months: 36))
        }
        for months in [0, -1, 85] {
            XCTAssertNil(LoanEstimate.calculate(price: 350_000, downPayment: 0, annualRate: 0.149, months: months))
        }
        XCTAssertNil(LoanEstimate.calculate(price: 350_000, downPayment: 0, annualRate: -0.1, months: 36))
    }

    func testCalculatorUpdatesAndInvalidPriceHidesEstimate() throws {
        let model = FinancingViewModel()
        let baseline = try XCTUnwrap(model.estimate)
        model.downPaymentPercent = 50
        XCTAssertLessThan(try XCTUnwrap(model.estimate).monthlyPayment, baseline.monthlyPayment)
        model.months = 60
        XCTAssertLessThan(try XCTUnwrap(model.estimate).monthlyPayment, baseline.monthlyPayment)
        for input in ["", "0", "-1", "350,000", "NaN", "3000001"] {
            model.priceInput = input
            XCTAssertNil(model.estimate)
        }
    }

    func testVehiclePriceInitializesCalculator() {
        XCTAssertEqual(FinancingViewModel(price: 449_900).price, 449_900)
    }
}

@MainActor
final class GarageTests: XCTestCase {
    func testGarageUsesMazdaMX5AndAllActionsHaveHonestNotices() {
        let model = GarageViewModel()
        XCTAssertEqual(model.vehicle.name, "Mazda MX-5")
        for action in GarageAction.allCases {
            model.open(action)
            XCTAssertEqual(model.notice?.title, action.title)
            XCTAssertEqual(model.notice?.message, action.message)
        }
    }
}

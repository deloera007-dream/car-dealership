import Foundation
import Observation

@MainActor
@Observable
final class FinancingViewModel {
    static let annualRate = 0.149
    static let terms = [12, 24, 36, 48, 60]
    var priceInput: String
    var downPaymentPercent = 20.0
    var months = 36

    init(price: Double = 350_000) {
        priceInput = price.isFinite && price > 0 && price <= 3_000_000 ? String(Int(price)) : ""
    }

    var price: Double? {
        guard !priceInput.isEmpty, priceInput.allSatisfy({ $0.isASCII && $0.isNumber }),
              let value = Double(priceInput), value > 0, value <= 3_000_000 else { return nil }
        return value
    }

    var downPayment: Double { (price ?? 0) * downPaymentPercent / 100 }

    var estimate: LoanEstimate? {
        guard let price, (10...80).contains(downPaymentPercent), Self.terms.contains(months) else { return nil }
        return LoanEstimate.calculate(price: price, downPayment: downPayment, annualRate: Self.annualRate, months: months)
    }
}

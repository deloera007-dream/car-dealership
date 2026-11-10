import Foundation

struct LoanEstimate: Equatable {
    let principal: Double
    let monthlyPayment: Double
    let interest: Double
    let totalPaid: Double

    static func calculate(price: Double, downPayment: Double, annualRate: Double, months: Int) -> LoanEstimate? {
        guard price.isFinite, downPayment.isFinite, annualRate.isFinite,
              price > 0, price <= 3_000_000, downPayment >= 0, downPayment <= price,
              (0...1).contains(annualRate), (1...84).contains(months) else { return nil }
        let principal = price - downPayment
        let rate = annualRate / 12
        let payment = rate == 0 ? principal / Double(months) : principal * rate / -expm1(-Double(months) * log1p(rate))
        guard payment.isFinite else { return nil }
        let totalLoan = payment * Double(months)
        return LoanEstimate(principal: principal, monthlyPayment: payment,
                            interest: max(0, totalLoan - principal), totalPaid: totalLoan + downPayment)
    }
}

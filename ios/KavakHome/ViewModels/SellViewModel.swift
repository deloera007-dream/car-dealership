import Observation

@MainActor
@Observable
final class SellViewModel {
    var form = SellingForm() {
        didSet {
            result = nil
            validationMessage = nil
        }
    }
    var result: Valuation?
    var validationMessage: String?

    var models: [String] {
        SampleInventory.vehicles.filter { $0.brand == form.brand }.map(\.model).sorted()
    }

    func selectBrand(_ brand: String) {
        form.brand = brand
        form.model = ""
    }

    func submit() {
        validationMessage = form.validationMessage
        result = Valuation.estimate(form)
    }
}

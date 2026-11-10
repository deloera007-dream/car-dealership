import SwiftUI

enum KavakTheme {
    static let blue = Color(red: 0, green: 107 / 255, blue: 1)
    static let deepBlue = Color(red: 0, green: 61 / 255, blue: 165 / 255)
    static let navy = Color(red: 23 / 255, green: 35 / 255, blue: 59 / 255)
    static let paleBlue = Color(red: 224 / 255, green: 237 / 255, blue: 1)
    static let cornerRadius: CGFloat = 26

    static let background = LinearGradient(
        colors: [blue, Color(red: 0, green: 85 / 255, blue: 225 / 255), deepBlue],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

struct KavakButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? 0.75 : 1)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

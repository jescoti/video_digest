import Foundation
import AppKit
import Vision

func cgImage(from nsImage: NSImage) -> CGImage? {
    var rect = NSRect(origin: .zero, size: nsImage.size)
    return nsImage.cgImage(forProposedRect: &rect, context: nil, hints: nil)
}

func ocr(_ url: URL) -> String {
    guard let img = NSImage(contentsOf: url),
          let cg = cgImage(from: img) else { return "" }

    let request = VNRecognizeTextRequest()
    request.recognitionLanguages = ["en-US"]
    request.usesLanguageCorrection = true
    request.recognitionLevel = .accurate

    let handler = VNImageRequestHandler(cgImage: cg, options: [:])
    do {
        try handler.perform([request])
        let observations = request.results ?? []
        let lines = observations.compactMap { $0.topCandidates(1).first?.string }
        return lines.joined(separator: "\n")
    } catch {
        fputs("Vision OCR error for \(url.lastPathComponent): \(error)\n", stderr)
        return ""
    }
}

let args = CommandLine.arguments.dropFirst()
guard !args.isEmpty else {
    fputs("usage: ocr_vision <image1> [image2 ...]\n", stderr)
    exit(2)
}

var out: [[String: String]] = []
for path in args {
    let u = URL(fileURLWithPath: path)
    out.append(["file": path, "text": ocr(u)])
}

let data = try! JSONSerialization.data(withJSONObject: out, options: [.prettyPrinted])
FileHandle.standardOutput.write(data)
import React, { useEffect, useRef } from "react";
import WebViewer from "@pdftron/webviewer";

const App = () => {
  const viewerRef = useRef(null);
  const pdfPath = "/Sample.pdf"; // Path to the PDF document
  const appearanceImgPath = "/path-to-your-signature-appearance.png"; // Replace with your signature appearance image path
  const certFilePath = "/path-to-your-cert.pfx"; // Replace with your certificate file path
  const certPassword = "your-password"; // Replace with your certificate password

  useEffect(() => {
    const viewerConfig = {
      licenseKey:
        "AngelBot AI LLP:OEM:AngelBot AI CRM::B+:AMS(20291022):0664A24CE67FB55A8048B253187CE30C600DE2660BDD878643CF028B9622DAB6F5C7",
      path: "/webviewer/lib",
      initialDoc: pdfPath,
    };

    WebViewer(viewerConfig, viewerRef.current)
      .then((instance) => {
        const { PDFNet, documentViewer } = instance.Core;

        // Enable digital signature features in the UI
        instance.UI.enableFeatures([
          "digitalSignatures",
          "annotations",
          "forms",
        ]);

        // Listen for when the document is loaded
        documentViewer.addEventListener("documentLoaded", async () => {
          await PDFNet.initialize();

          const doc = await documentViewer.getDocument().getPDFDoc();

          // Run PDFNet operations with cleanup
          await PDFNet.runWithCleanup(async () => {
            // Lock the document for changes
            doc.lock();

            // Enable Forms
            const hasForms = await doc.hasForms();
            console.log("Does document have forms?", hasForms);

            // Add a standard signature handler
            const sigHandlerId = await doc.addStdSignatureHandlerFromURL(
              certFilePath,
              certPassword
            );

            // Define a sample signature field name for the existing PDF
            const approvalFieldName = "ApprovalField"; // Update this with your field name in the PDF
            const foundApprovalField = await doc.getField(approvalFieldName);
            const approvalSigField =
              await PDFNet.DigitalSignatureField.createFromField(
                foundApprovalField
              );

            // Optionally add extra details to the signature
            await approvalSigField.setLocation("Vancouver, BC");
            await approvalSigField.setReason("Document approval.");
            await approvalSigField.setContactInfo("www.apryse.com");

            // Optionally add a visual signature appearance
            const img = await PDFNet.Image.createFromURL(
              doc,
              appearanceImgPath
            );
            const approvalSignatureWidget =
              await PDFNet.SignatureWidget.createWithDigitalSignatureField(
                doc,
                await PDFNet.Rect.init(50, 550, 250, 650), // Coordinates for signature placement
                approvalSigField
              );
            await approvalSignatureWidget.createSignatureAppearance(img);
            const page1 = await doc.getPage(1);
            page1.annotPushBack(approvalSignatureWidget);

            // Prepare for signing the document
            await approvalSigField.signOnNextSaveWithCustomHandler(
              sigHandlerId
            );

            // Save the signed document
            const buf = await doc.saveMemoryBuffer(
              PDFNet.SDFDoc.SaveOptions.e_linearized
            );
            const blob = new Blob([buf], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "SignedDocument.pdf";
            link.click();
          });
        });
      })
      .catch((error) => {
        console.error("Error initializing WebViewer:", error);
      });
  }, [pdfPath]);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1 style={{ textAlign: "center", margin: "auto 80px" }}>
        Costa Cloud Digital Signature
      </h1>
      <div
        ref={viewerRef}
        style={{
          height: "800px",
          width: "70%",
          margin: "20px 30%",
          border: "1px solid #000",
        }}
      ></div>
    </div>
  );
};

export default App;

import React, { useEffect, useRef, useState } from "react";
import WebViewer from "@pdftron/webviewer";
import {
  Button,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FileUploadIcon from "@mui/icons-material/UploadFile";

const App = () => {
  const viewerRef = useRef(null);
  const [digitalIDFile, setDigitalIDFile] = useState(null);
  const [digitalIDPassword, setDigitalIDPassword] = useState("");
  const [signatureInfo, setSignatureInfo] = useState({
    location: "",
    reason: "",
    contact: "",
  });

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

        instance.UI.enableFeatures([
          "digitalSignatures",
          "annotations",
          "forms",
        ]);

        documentViewer.addEventListener("documentLoaded", async () => {
          await PDFNet.initialize();

          const doc = await documentViewer.getDocument().getPDFDoc();
          await PDFNet.runWithCleanup(async () => {
            doc.lock();

            const sigHandlerId = await doc.addStdSignatureHandlerFromURL(
              certFilePath,
              certPassword
            );
            const approvalFieldName = "ApprovalField";
            const foundApprovalField = await doc.getField(approvalFieldName);

            const approvalSigField =
              await PDFNet.DigitalSignatureField.createFromField(
                foundApprovalField
              );

            await approvalSigField.setLocation(signatureInfo.location);
            await approvalSigField.setReason(signatureInfo.reason);
            await approvalSigField.setContactInfo(signatureInfo.contact);

            const img = await PDFNet.Image.createFromURL(
              doc,
              appearanceImgPath
            );
            const approvalSignatureWidget =
              await PDFNet.SignatureWidget.createWithDigitalSignatureField(
                doc,
                await PDFNet.Rect.init(50, 550, 250, 650),
                approvalSigField
              );
            await approvalSignatureWidget.createSignatureAppearance(img);
            const page1 = await doc.getPage(1);
            page1.annotPushBack(approvalSignatureWidget);

            await approvalSigField.signOnNextSaveWithCustomHandler(
              sigHandlerId
            );

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
  }, [pdfPath, signatureInfo]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setDigitalIDFile(file);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setSignatureInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplySignature = () => {
    console.log("Digital ID File:", digitalIDFile);
    console.log("Password:", digitalIDPassword);
    console.log("Signature Info:", signatureInfo);
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* WebViewer on the left */}
      <Box
        ref={viewerRef}
        sx={{ flex: 3, border: "1px solid #000", height: "100%" }}
      ></Box>

      {/* Digital Signature UI on the right */}
      <Box
        sx={{
          flex: 1,
          padding: 4,
          backgroundColor: "#f7f7f7",
          borderLeft: "1px solid #ddd",
          overflowY: "auto",
        }}
      >
        <Typography variant="h5" textAlign="center" gutterBottom>
          Digital Signatures
        </Typography>
        <Typography variant="body2" textAlign="center" gutterBottom>
          Costa Cloud Digital Signature
        </Typography>
        <Button
          variant="contained"
          component="label"
          startIcon={<FileUploadIcon />}
          fullWidth
          sx={{ mb: 2 }}
        >
          Choose File
          <input type="file" hidden onChange={handleFileUpload} />
        </Button>
        {digitalIDFile && (
          <Typography variant="body2" gutterBottom>
            Selected File: {digitalIDFile.name}
          </Typography>
        )}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Digital ID (optional)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Button
              variant="contained"
              component="label"
              fullWidth
              sx={{ mb: 2 }}
            >
              Select Digital ID File
              <input type="file" hidden onChange={handleFileUpload} />
            </Button>
            {digitalIDFile && (
              <Typography variant="body2" gutterBottom>
                Selected Digital ID: {digitalIDFile.name}
              </Typography>
            )}
            <TextField
              label="Digital ID Password"
              type="password"
              fullWidth
              value={digitalIDPassword}
              onChange={(e) => setDigitalIDPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
          </AccordionDetails>
        </Accordion>
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Set Signature Information (optional)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              label="Set Location"
              name="location"
              fullWidth
              value={signatureInfo.location}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Set Reason"
              name="reason"
              fullWidth
              value={signatureInfo.reason}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Set Contact Information"
              name="contact"
              fullWidth
              value={signatureInfo.contact}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
          </AccordionDetails>
        </Accordion>
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 3 }}
          onClick={handleApplySignature}
        >
          Apply Approval Signature
        </Button>
      </Box>
    </Box>
  );
};

export default App;

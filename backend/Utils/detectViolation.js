const detectViolation = (type) => {
  switch (type) {
    case "tab-switch":
      return "Student switched tabs";

    case "webcam-off":
      return "Webcam turned off";

    case "multiple-person-detected":
      return "Multiple persons detected";

    case "mobile-detected":
      return "Mobile phone detected";

    default:
      return "Unknown violation";
  }
};

export default detectViolation;
import jwt from "jsonwebtoken";

const generateToken = (id, role) => {
  return jwt.sign(
    {
      id,
      role,
    },
    process.env.JWT_SECRET || "replace-this-jwt-secret",
    {
      expiresIn: "1d",
    }
  );
};

export default generateToken;

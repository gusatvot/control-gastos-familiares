export default function handler(request, response) {
  response.status(200).json({ message: "¡Hola desde la función serverless!" });
}

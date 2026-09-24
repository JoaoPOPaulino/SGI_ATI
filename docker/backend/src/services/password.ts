export const PASSWORD_MESSAGE = "A senha deve ter no mínimo 6 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial (espaço não conta).";
export function senhaValida(senha: unknown): senha is string {
  return typeof senha === "string" && senha.length >= 6 && Buffer.byteLength(senha, "utf8") <= 72
    && /[A-Z]/.test(senha) && /[a-z]/.test(senha) && /[0-9]/.test(senha) && /[^A-Za-z0-9\s]/.test(senha);
}

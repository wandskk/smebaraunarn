import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { formatCpf, maskCpf } from "./utils";

describe("maskCpf", () => {
  test("mascara o miolo, mantendo os 3 primeiros e os 2 últimos dígitos", () => {
    assert.equal(maskCpf("12345678901"), "123.***.***-01");
  });

  test("aceita CPF já formatado, igual normalizeCpf/formatCpf", () => {
    assert.equal(maskCpf("123.456.789-01"), "123.***.***-01");
  });

  test("nunca revela mais dígitos que formatCpf revelaria — miolo sempre oculto", () => {
    const cpf = "98765432100";
    const mascarado = maskCpf(cpf);
    const completo = formatCpf(cpf);
    assert.equal(mascarado.slice(0, 3), completo.slice(0, 3));
    assert.equal(mascarado.slice(-2), completo.slice(-2));
    assert.doesNotMatch(mascarado, /456|765|432/); // miolo do CPF de teste não aparece
  });
});

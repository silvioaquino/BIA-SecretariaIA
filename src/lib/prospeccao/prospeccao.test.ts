import { test } from "node:test";
import assert from "node:assert/strict";
import { cidadeAlvo, numero, porteEstimado, telefone } from "./normalizar";
import { pontuar } from "./pontuacao";

test("telefone: celular, fixo, com 55 e lixo", () => {
  assert.deepEqual(telefone("(81) 99258-6464"), { numero: "5581992586464", tipo: "CELULAR" });
  assert.deepEqual(telefone("(81) 3052-2850"), { numero: "558130522850", tipo: "FIXO" });
  assert.deepEqual(telefone("+55 81 99258-6464"), { numero: "5581992586464", tipo: "CELULAR" });
  assert.deepEqual(telefone("081 3542-7981"), { numero: "558135427981", tipo: "FIXO" });
  assert.equal(telefone("123"), null);
  assert.equal(telefone(null), null);
});

test("cidade: só as 6 cidades-alvo", () => {
  assert.equal(cidadeAlvo("Olinda"), "Olinda");
  assert.equal(cidadeAlvo("Abreu e Lima - PE"), "Abreu e Lima");
  assert.equal(cidadeAlvo("Itamaracá"), "Ilha de Itamaracá");
  assert.equal(cidadeAlvo("PAULISTA"), "Paulista");
  assert.equal(cidadeAlvo("Recife"), null);
  assert.equal(cidadeAlvo("São Paulo"), null); // não confundir com Paulista
});

test("porte e número", () => {
  assert.equal(porteEstimado(30), "PEQUENA");
  assert.equal(porteEstimado(100), "MEDIA");
  assert.equal(porteEstimado(301), "GRANDE");
  assert.equal(numero("3,9"), 3.9);
});

test("pontuação: clínica ideal fica na faixa A", () => {
  const r = pontuar({ nome: "Instituto de Olhos X", tipo: "OFTALMOLOGIA", nota: 4.9, avaliacoes: 100, tipoTelefone: "CELULAR", temWhatsapp: true });
  assert.equal(r.faixa, "A");
  assert.equal(r.pontuacao, 30 + 20 + 25 + 15);
  assert.equal(r.descartar, false);
});

test("pontuação: poucas avaliações e fixo fica na faixa C", () => {
  const r = pontuar({ nome: "Dr. Fulano", tipo: "ODONTOLOGIA", nota: 5, avaliacoes: 2, tipoTelefone: "FIXO", temWhatsapp: null });
  assert.equal(r.faixa, "C");
});

test("pontuação: hospital, farmácia e fechada são descartados", () => {
  assert.equal(pontuar({ nome: "Hospital São José", tipo: "MEDICINA", nota: 4, avaliacoes: 50, tipoTelefone: null, temWhatsapp: null }).descartar, true);
  assert.equal(pontuar({ nome: "Clínica Boa", tipo: "MEDICINA", nota: 4, avaliacoes: 50, tipoTelefone: null, temWhatsapp: null, tiposGoogle: ["pharmacy"] }).descartar, true);
  assert.equal(pontuar({ nome: "Clínica Boa", tipo: "MEDICINA", nota: 4, avaliacoes: 50, tipoTelefone: null, temWhatsapp: null, fechadaNoGoogle: true }).descartar, true);
  // "Ótica" descarta, mas "Oftalmologia" não
  assert.equal(pontuar({ nome: "Ótica Visão", tipo: "OFTALMOLOGIA", nota: 4, avaliacoes: 50, tipoTelefone: null, temWhatsapp: null }).descartar, true);
  assert.equal(pontuar({ nome: "Clínica de Oftalmologia OftalmoAbreu", tipo: "OFTALMOLOGIA", nota: 4.5, avaliacoes: 30, tipoTelefone: "FIXO", temWhatsapp: null }).descartar, false);
});

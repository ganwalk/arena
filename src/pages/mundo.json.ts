import type { APIRoute } from "astro";
import { grade, pontos, registros, GOIANIA } from "../lib/mundo";

// Dados do mapa, carregados pelo navegador só quando a seção se aproxima da tela.
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      grade,
      origem: GOIANIA,
      pontos: pontos(),
      registros: registros.filter((r) => r.cat !== "arena"),
    }),
    { headers: { "Content-Type": "application/json" } },
  );

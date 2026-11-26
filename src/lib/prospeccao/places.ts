import "server-only";

// Google Places API (New) · Text Search
// https://developers.google.com/maps/documentation/places/web-service/text-search
// Os campos pedidos definem o preço: telefone, site e nota caem no SKU
// "Text Search Enterprise" (1.000 chamadas grátis por mês). Não adicione campos à toa.

const URL_BUSCA = process.env.PLACES_API_URL ?? "https://places.googleapis.com/v1/places:searchText";

const CAMPOS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
  "places.types",
  "nextPageToken",
].join(",");

export type Lugar = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  addressComponents?: { longText: string; shortText?: string; types?: string[] }[];
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY";
  types?: string[];
};

export class ErroPlaces extends Error {}

/** Busca um termo e segue as páginas (até 3 = 60 resultados). Devolve os lugares e quantas chamadas fez. */
export async function buscarLugares(textQuery: string, maxPaginas = 3) {
  const chave = process.env.GOOGLE_PLACES_API_KEY;
  if (!chave) throw new ErroPlaces("GOOGLE_PLACES_API_KEY não configurada");

  const lugares: Lugar[] = [];
  let pageToken: string | undefined;
  let chamadas = 0;

  do {
    const res = await fetch(URL_BUSCA, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": chave,
        "X-Goog-FieldMask": CAMPOS,
      },
      body: JSON.stringify({ textQuery, languageCode: "pt-BR", regionCode: "BR", pageSize: 20, pageToken }),
    });
    chamadas++;
    const corpo = (await res.json().catch(() => null)) as { places?: Lugar[]; nextPageToken?: string; error?: { message?: string } } | null;
    if (!res.ok) throw new ErroPlaces(`Places ${res.status}: ${corpo?.error?.message ?? "erro"}`);
    lugares.push(...(corpo?.places ?? []));
    pageToken = corpo?.nextPageToken;
  } while (pageToken && chamadas < maxPaginas);

  return { lugares, chamadas };
}

/** Cidade e bairro a partir dos componentes do endereço. */
export function cidadeEBairro(l: Lugar) {
  const comp = l.addressComponents ?? [];
  // na API real, alguns componentes vêm sem "types"
  const achar = (tipo: string) => comp.find((c) => c.types?.includes(tipo))?.longText ?? null;
  return {
    cidade: achar("administrative_area_level_2") ?? achar("locality"),
    bairro: achar("sublocality_level_1") ?? achar("sublocality") ?? achar("neighborhood"),
  };
}

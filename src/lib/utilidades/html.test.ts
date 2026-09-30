import { describe, expect, it } from "vitest";

import { escaparHtml } from "./html";

describe("escaparHtml", () => {
  it("un nombre con etiquetas se queda en texto", () => {
    expect(escaparHtml(`<img src=x onerror="alert('x')">`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;",
    );
  });
  it("el & va primero, para no escapar dos veces", () => {
    expect(escaparHtml("Pan & <b>")).toBe("Pan &amp; &lt;b&gt;");
  });
});

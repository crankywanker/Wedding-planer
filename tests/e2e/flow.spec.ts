import { expect, test, type Page } from "@playwright/test";

// Walks the whole plan in demo mode: interview → venues → food → vendors →
// guest list → estimate, then checks the plan survives a reload.

async function answer(page: Page, text: string) {
  const before = await page.locator(".bubble.assistant:not(.typing)").count();
  await page.getByPlaceholder("Type your answer…").fill(text);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator(".bubble.assistant:not(.typing)")).toHaveCount(before + 1);
}

test("plans a wedding end to end", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await expect(page.locator(".bubble.assistant").first()).toContainText("names");
  for (const a of ["Sam and Alex", "June 2027", "Asheville, NC", "120 guests", "$40k", "rustic", "BBQ family style", "vegetarians", "Photographer, Florist", "string lights"]) {
    await answer(page, a);
  }
  await expect(page.locator(".profile")).toContainText("$40,000");
  await page.getByRole("button", { name: "See my venues →" }).click();

  // Venues: top 5, pick two, configure, favorite, slideshow, change favorite.
  await page.getByRole("button", { name: "Find my top 5" }).click();
  const cards = page.locator(".option");
  await expect(cards).toHaveCount(5);
  await cards.nth(0).getByRole("button", { name: "Pick" }).click();
  await cards.nth(2).getByRole("button", { name: "Pick" }).click();
  await cards.nth(0).getByRole("button", { name: "Configure" }).click();
  await cards.nth(0).getByLabel(/On-site ceremony/).check();
  await expect(cards.nth(0).locator(".price strong")).toHaveText("$12,800"); // 9,500 + 15×120 + 1,500
  await cards.nth(0).getByRole("button", { name: "☆ Favorite" }).click();
  await page.getByRole("button", { name: /Slideshow \(2\)/ }).click();
  const slide = page.getByRole("dialog", { name: "Slideshow" });
  await expect(slide).toContainText("Willow Creek Barn");
  await slide.getByRole("button", { name: "Next" }).click();
  await expect(slide).toContainText("Rosewood Estate");
  await slide.getByRole("button", { name: "☆ Make favorite" }).click();
  await page.keyboard.press("Escape");
  await expect(slide).toBeHidden();
  await expect(page.getByText("Favorite: Rosewood Estate")).toBeVisible();

  // Food and vendors.
  await page.getByRole("button", { name: "3 · Food" }).click();
  await page.getByRole("button", { name: "Find my top 5" }).click();
  await cards.nth(2).getByRole("button", { name: "☆ Favorite" }).click();
  await page.getByRole("button", { name: "4 · Vendors" }).click();
  await expect(page.getByRole("button", { name: "Florist" })).toBeVisible();
  await page.getByRole("button", { name: "Find my top 5" }).click();
  await cards.nth(0).getByRole("button", { name: "☆ Favorite" }).click();

  // Guest list.
  await page.getByRole("button", { name: "5 · Guest list" }).click();
  await page.getByPlaceholder(/Paste many names/).fill("Ann\nBob, Cara");
  await page.getByRole("button", { name: "Add all" }).click();
  await page.getByPlaceholder("Guest name").fill("Dan");
  await page.getByRole("button", { name: "Add guest" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await expect(page.getByText(/interview estimate of 120 guests/)).toBeVisible();

  // Estimate: Rosewood 15,000 + 25×120 = 18,000; BBQ 42×120 = 5,040;
  // photographer 2,400; subtotal 25,440; +10% = 27,984.
  await page.getByRole("button", { name: "6 · Est. cost" }).click();
  await expect(page.locator(".total h2")).toHaveText("$27,984");
  await expect(page.getByText("under your $40,000 budget")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sam and Alex’s Wedding");
  await page.getByRole("button", { name: "6 · Est. cost" }).click();
  await expect(page.locator(".total h2")).toHaveText("$27,984");

  expect(errors).toEqual([]);
});

test("fits a phone screen without sideways scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".bubble.assistant").first()).toBeVisible();
  for (const tab of ["1 · Interview", "2 · Venues", "5 · Guest list", "6 · Est. cost"]) {
    await page.getByRole("button", { name: tab }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  }
});

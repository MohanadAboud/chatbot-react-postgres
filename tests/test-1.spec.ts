import { test, expect } from "@playwright/test";

test("Create and delete a thread", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.getByRole("link", { name: "+ New" }).click();
  await page
    .getByRole("textbox", { name: "Type your message here..." })
    .click();
  await page
    .getByRole("textbox", { name: "Type your message here..." })
    .fill("hej");
  await page.getByRole("button", { name: "Send" }).click();
  await page
    .getByRole("button", { name: "Delete thread: hej" })
    .first()
    .click();
});

import { expect, test, type Page } from '@playwright/test'

/**
 * OpenGIPHY — end-to-end checks against the real running app.
 *
 * Prerequisites (the suite starts nothing itself — see playwright.config.ts):
 *   - backend on http://localhost:8000 with the seeded demo data
 *   - frontend dev server on http://localhost:5173 (VITE_USE_MOCKS=false)
 *
 * Every test is independent: Playwright gives each test a fresh browser
 * context, and the tests that need auth log in through the helper below.
 */

const DEMO_EMAIL = 'demo@example.com'
const DEMO_PASSWORD = 'demo1234'
const DEMO_USERNAME = 'demo'

/** Log in through the real login form and wait for the topbar profile chip. */
async function login(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(DEMO_EMAIL)
  await page.getByLabel('Password').fill(DEMO_PASSWORD)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(
    page.getByRole('link', { name: `Your profile, @${DEMO_USERNAME}` }),
  ).toBeVisible()
}

/**
 * From the home feed, open the detail page of the first GIF card and return
 * its title (cards carry the title as the image alt text and as the title
 * link's text; the title link is the anchor that contains that text).
 */
async function openFirstGifDetail(page: Page): Promise<string> {
  await page.goto('/')
  const firstCard = page.locator('article').first()
  await expect(firstCard).toBeVisible()
  const title = (await firstCard.locator('img').first().getAttribute('alt')) ?? ''
  expect(title.length).toBeGreaterThan(0)
  await firstCard.locator('a').filter({ hasText: title }).click()
  await expect(page).toHaveURL(/\/g\/\d+$/)
  return title
}

test('home page loads and shows seeded GIF cards', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Every reaction. One search away.' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Latest GIFs' })).toBeVisible()

  const cards = page.locator('article')
  await expect(cards.first()).toBeVisible()
  expect(await cards.count()).toBeGreaterThanOrEqual(3)
  await expect(cards.first().locator('img')).toBeVisible()
})

test('search from the topbar shows matching GIFs', async ({ page }) => {
  await page.goto('/')

  // The topbar renders two SearchBars (wide + compact layout); exactly one
  // is visible at desktop width — scope to the visible form.
  const searchForm = page.locator('header form:visible')
  await searchForm.getByLabel('Search GIFs').fill('cat')
  await searchForm.getByRole('button', { name: 'Search' }).click()

  await expect(page).toHaveURL(/\/search\?q=cat/)
  await expect(
    page.getByRole('heading', { name: 'Results for "cat"' }),
  ).toBeVisible()

  const results = page.locator('article')
  await expect(results.first()).toBeVisible()
  // Seeded titles include cat GIFs (e.g. "Keyboard Cat", "Smug Cat").
  await expect(results.filter({ hasText: /cat/i }).first()).toBeVisible()
})

test('trending page shows GIF cards', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Trending', exact: true }).click()

  await expect(page).toHaveURL(/\/trending$/)
  await expect(
    page.getByRole('heading', { name: 'Trending', exact: true }),
  ).toBeVisible()

  const cards = page.locator('article')
  await expect(cards.first()).toBeVisible()
  expect(await cards.count()).toBeGreaterThanOrEqual(3)
})

test('clicking a GIF card opens its detail page with embed codes', async ({
  page,
}) => {
  const title = await openFirstGifDetail(page)

  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await expect(page.getByRole('img', { name: title })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Embed this GIF' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Download' })).toBeVisible()
})

test('login with the demo account shows the profile chip', async ({ page }) => {
  await login(page)

  await expect(
    page.getByRole('link', { name: `Your profile, @${DEMO_USERNAME}` }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Upload' })).toBeVisible()
})

test('liking a GIF on its detail page increases the like count by one', async ({
  page,
}) => {
  await login(page)
  await openFirstGifDetail(page)

  const likeCount = page.getByTestId('like-count')
  const likeButton = page.getByRole('button', { name: 'Like this GIF' })
  const unlikeButton = page.getByRole('button', { name: 'Unlike this GIF' })
  await expect(likeButton.or(unlikeButton)).toBeVisible()

  // Normalise to "not liked" first: demo may already like this GIF from the
  // seed, and the +1 assertion below must hold whatever the starting state.
  if (await unlikeButton.isVisible()) {
    const likedCount = Number(await likeCount.textContent())
    await unlikeButton.click()
    await expect(likeCount).toHaveText(String(likedCount - 1))
    await expect(likeButton).toBeVisible()
  }

  const before = Number(await likeCount.textContent())
  await likeButton.click()
  await expect(likeCount).toHaveText(String(before + 1))
  await expect(unlikeButton).toBeVisible()
})

test('download button on the detail page saves a .gif file', async ({
  page,
}) => {
  await openFirstGifDetail(page)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Download' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.gif$/i)
})

test('own profile shows info, Uploads and Liked tabs, and liked GIFs', async ({
  page,
}) => {
  await login(page)
  await page
    .getByRole('link', { name: `Your profile, @${DEMO_USERNAME}` })
    .click()

  await expect(page).toHaveURL(new RegExp(`/u/${DEMO_USERNAME}$`))
  await expect(
    page.getByRole('heading', { name: `@${DEMO_USERNAME}` }),
  ).toBeVisible()
  // The email is only rendered on your own profile.
  await expect(page.getByText(DEMO_EMAIL)).toBeVisible()

  const uploadsTab = page.getByRole('tab', { name: 'Uploads' })
  const likedTab = page.getByRole('tab', { name: 'Liked' })
  await expect(uploadsTab).toBeVisible()
  await expect(likedTab).toBeVisible()

  // Uploads is the default tab and demo has seeded uploads.
  await expect(page.locator('article').first()).toBeVisible()

  // Liked tab: demo has seeded likes, so GIF cards must show here too.
  await likedTab.click()
  await expect(likedTab).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('article').first()).toBeVisible()
  expect(await page.locator('article').count()).toBeGreaterThanOrEqual(1)
})

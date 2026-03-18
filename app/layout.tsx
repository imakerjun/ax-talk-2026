import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { Search } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata = {
  title: {
    default: 'AX, 반복에서 축적으로',
    template: '%s | AX, 반복에서 축적으로',
  },
  description:
    '우아한형제들 사례 중심 — AI 활용의 진짜 전환점은 반복을 축적으로 바꾸는 구조를 만드는 것이다.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={
            <Navbar
              logo={<strong>AX, 반복에서 축적으로</strong>}
            >
              <Search />
            </Navbar>
          }
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/woowacourse/wmakerjun"
          footer={
            <Footer>
              <p>
                2026.03.25 삼성SDS 특강 — 우아한형제들 임동준(makerjun)
              </p>
            </Footer>
          }
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}

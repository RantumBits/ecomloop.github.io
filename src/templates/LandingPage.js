import React from 'react'
import { graphql } from 'gatsby'

import PageHeader from '../components/PageHeader'
import Content from '../components/Content.js'
import Layout from '../components/Layout.js'
import Accordion from '../components/Accordion'
import BackgroundVideo from '../components/BackgroundVideo'
import Gallery from '../components/Gallery'
import Popup from '../components/Popup'

// Export Template for use in CMS preview
export const LandingPageTemplate = ({
  title,
  subtitle,
  featuredImage,
  section1,
  section2,
  section3,
  video,
  date,
  videoPoster,
  videoTitle,
  accordion,
  accordion2,
  service,
  body,
  gallery
}) => (
  <main>
  
    <PageHeader

      title={title}
      subtitle={subtitle}
      backgroundImage={featuredImage}
    />
    <section className="section">
      <div className="container">

        <Content source={section1} />

      </div>
    </section>

    <section className="BackgroundVideo-section section">
    <BackgroundVideo poster={videoPoster} videoTitle={videoTitle}>
      {video && <source src={video} type="video/mp4" />}
    </BackgroundVideo>
  </section>

    <section className="section">
      <div className="container">
        <h4>{service} | {date}</h4>
        <Gallery images={gallery} />
      </div>
    </section>

    <section className="section">
      <div className="container">
        <Content source={section2} />
      </div>
    </section>




    <section className="section">
      <div className="container">
        <Accordion items={accordion} />
      </div>
    </section>

    <section className="section">
      <div className="container">
        <Content source={section3} />
      </div>
    </section>

    <section className="section">
      <div className="container">
        <Accordion items={accordion} />
      </div>
    </section>

    <section className="section">
      <div className="container">
        <Popup>
          <Content source={section3} />
        </Popup>
      </div>
    </section>
  </main>
)

const LandingPage = ({ data: { page } }) => (
  <Layout
    meta={page.frontmatter.meta || false}
    title={page.frontmatter.title || false}
  >
    <LandingPageTemplate {...page} {...page.frontmatter} body={page.html} />

    <div class="grid max-w-screen-md gap-10 md:grid-cols-2 sm:mx-auto"><div><div class="p-8 bg-gray-900 rounded"><div class="mb-4 text-center"><p class="text-xl font-medium tracking-wide text-white">
              Starter Plan
            </p> <div class="flex items-center justify-center"><p class="mr-2 text-5xl font-semibold text-white lg:text-6xl">
                $39
              </p> <p class="text-lg text-gray-500">
                / month
              </p></div></div> <ul class="mb-8 space-y-2"><li class="flex items-center"><div class="mr-3"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-width="2" class="w-4 h-4 text-blue-100"><polyline fill="none" stroke="currentColor" points="6,12 10,16 18,8"></polyline> <circle cx="12" cy="12" fill="none" r="11" stroke="currentColor"></circle></svg></div> <p class="font-medium text-gray-300">
                10 deploys per day
              </p></li> <li class="flex items-center"><div class="mr-3"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-width="2" class="w-4 h-4 text-blue-100"><polyline fill="none" stroke="currentColor" points="6,12 10,16 18,8"></polyline> <circle cx="12" cy="12" fill="none" r="11" stroke="currentColor"></circle></svg></div> <p class="font-medium text-gray-300">
                10 GB of storage
              </p></li> <li class="flex items-center"><div class="mr-3"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-width="2" class="w-4 h-4 text-blue-100"><polyline fill="none" stroke="currentColor" points="6,12 10,16 18,8"></polyline> <circle cx="12" cy="12" fill="none" r="11" stroke="currentColor"></circle></svg></div> <p class="font-medium text-gray-300">
                3 domains
              </p></li> <li class="flex items-center"><div class="mr-3"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-width="2" class="w-4 h-4 text-blue-100"><polyline fill="none" stroke="currentColor" points="6,12 10,16 18,8"></polyline> <circle cx="12" cy="12" fill="none" r="11" stroke="currentColor"></circle></svg></div> <p class="font-medium text-gray-300">
                SSL Certificates
              </p></li></ul> <button type="submit" class="inline-flex items-center justify-center w-full h-12 px-6 font-medium tracking-wide text-white transition duration-200 rounded shadow-md bg-blue-600 hover:bg-blue-600 focus:shadow-outline focus:outline-none">
            Get Now
          </button></div> <div class="w-11/12 h-2 mx-auto bg-gray-900 rounded-b opacity-75"></div> <div class="w-10/12 h-2 mx-auto bg-gray-900 rounded-b opacity-50"></div> <div class="w-9/12 h-2 mx-auto bg-gray-900 rounded-b opacity-25"></div></div> <div><div class="p-8 bg-gray-900 rounded"><div class="mb-4 text-center"><p class="text-xl font-medium tracking-wide text-white">
              Pro Plan
            </p> <div class="flex items-center justify-center"><p class="mr-2 text-5xl font-semibold text-white lg:text-6xl">
                $59
              </p> <p class="text-lg text-gray-500">
                / month
              </p></div></div> <ul class="mb-8 space-y-2"><li class="flex items-center"><div class="mr-3"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-width="2" class="w-4 h-4 text-blue-100"><polyline fill="none" stroke="currentColor" points="6,12 10,16 18,8"></polyline> <circle cx="12" cy="12" fill="none" r="11" stroke="currentColor"></circle></svg></div> <p class="font-medium text-gray-300">
                100 deploys per day
              </p></li> <li class="flex items-center"><div class="mr-3"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-width="2" class="w-4 h-4 text-blue-100"><polyline fill="none" stroke="currentColor" points="6,12 10,16 18,8"></polyline> <circle cx="12" cy="12" fill="none" r="11" stroke="currentColor"></circle></svg></div> <p class="font-medium text-gray-300">
                50 GB of storage
              </p></li> <li class="flex items-center"><div class="mr-3"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-width="2" class="w-4 h-4 text-blue-100"><polyline fill="none" stroke="currentColor" points="6,12 10,16 18,8"></polyline> <circle cx="12" cy="12" fill="none" r="11" stroke="currentColor"></circle></svg></div> <p class="font-medium text-gray-300">
                Unlimited domains
              </p></li> <li class="flex items-center"><div class="mr-3"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-width="2" class="w-4 h-4 text-blue-100"><polyline fill="none" stroke="currentColor" points="6,12 10,16 18,8"></polyline> <circle cx="12" cy="12" fill="none" r="11" stroke="currentColor"></circle></svg></div> <p class="font-medium text-gray-300">
                SSL Certificates
              </p></li></ul> <button type="submit" class="inline-flex items-center justify-center w-full h-12 px-6 font-semibold tracking-wide text-white transition duration-200 rounded shadow-md bg-blue-600 hover:bg-blue-600 focus:shadow-outline focus:outline-none">
            Get Now
          </button></div> <div class="w-11/12 h-2 mx-auto bg-gray-900 rounded-b opacity-75"></div> <div class="w-10/12 h-2 mx-auto bg-gray-900 rounded-b opacity-50"></div> <div class="w-9/12 h-2 mx-auto bg-gray-900 rounded-b opacity-25"></div></div></div>
  </Layout>
)

export default LandingPage

export const pageQuery = graphql`
  query LandingPage($id: String!) {
    page: markdownRemark(id: { eq: $id }) {
      ...Meta
      ...Gallery
      html
      frontmatter {
        title
        template
        subtitle
        featuredImage
        section1
        section2
        section3
        date(formatString: "MMMM YYYY")
        video
        videoPoster
        videoTitle
        service
        accordion {
          title
          description
        }
      }
    }
  }
`

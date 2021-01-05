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

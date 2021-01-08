import React from 'react'
import { graphql } from 'gatsby'

import PageHeader from '../components/PageHeader'
import Content from '../components/Content.js'
import Layout from '../components/Layout.js'
import Accordion from '../components/Accordion'
import BackgroundVideo from '../components/BackgroundVideo'
import Gallery from '../components/Gallery'
import Popup from '../components/Popup'
import Styles from './LandingPage.css'


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
  gallery2,
  gallery,
  planTitle_A,
  planPrice_A,
  planCTA_A,
  planLink_A,
  planFeature01_A,
  planFeature02_A,
  planFeature03_A,
  planFeature04_A,
  planFeature05_A,
  planTitle_B,
  planPrice_B,
  planCTA_B,
  planLink_B,
  planFeature01_B,
  planFeature02_B,
  planFeature03_B,
  planFeature04_B,
  planFeature05_B,
  planFeature06_B,
  planFeature07_B,
  planTitle_C,
  planPrice_C,
  planCTA_C,
  planLink_C,
  planFeature01_C,
  planFeature02_C,
  planFeature03_C,
  planFeature04_C,
  planFeature05_C,
  planFeature06_C,
  planFeature07_C
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
    <div className="wave">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">

    <path fill="#fff" fill-opacity="1" d="M0,64L80,53.3C160,43,320,21,480,21.3C640,21,800,43,960,48C1120,53,1280,43,1360,37.3L1440,32L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"></path>
    </svg>
    </div>
    <BackgroundVideo poster={videoPoster} videoTitle={videoTitle}>

      {video && <source src={video} type="video/mp4" />}
    </BackgroundVideo>

    <div className="waveBottom">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="#fff" fill-opacity="1" d="M0,64L80,53.3C160,43,320,21,480,21.3C640,21,800,43,960,48C1120,53,1280,43,1360,37.3L1440,32L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path></svg>
    </div>
  </section>

  <section className="section">
    <div className="container">
      <Content source={section3} />
    </div>
  </section>



    <section className="section">
      <div className="container">

        <Gallery images={gallery} />
      </div>
    </section>


    <section className="section">
    <div className="wave-bg-content">
    <div className="wave">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
    <path fill="#fff" fill-opacity="1" d="M0,128L40,117.3C80,107,160,85,240,117.3C320,149,400,235,480,261.3C560,288,640,256,720,224C800,192,880,160,960,170.7C1040,181,1120,235,1200,234.7C1280,235,1360,181,1400,154.7L1440,128L1440,0L1400,0C1360,0,1280,0,1200,0C1120,0,1040,0,960,0C880,0,800,0,720,0C640,0,560,0,480,0C400,0,320,0,240,0C160,0,80,0,40,0L0,0Z"></path>
  </svg>
  </div>

      <div className="container">
        <Content source={section2} />
      </div>

      <div className="waveBottom">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
        <path fill="#fff" fill-opacity="1" d="M0,32L40,64C80,96,160,160,240,186.7C320,213,400,203,480,176C560,149,640,107,720,106.7C800,107,880,149,960,154.7C1040,160,1120,128,1200,122.7C1280,117,1360,139,1400,149.3L1440,160L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z"></path>
      </svg>
    </div>
      </div>
    </section>



    <section className="section">
      <div className="container center">
      <h2>Uncommon features of our {service}</h2>
        <Accordion items={accordion} />
      </div>
    </section>


    <section className="section">
      <div className="container center">
        <h2>How our {service} work</h2>
        <Gallery images={gallery2} />
      </div>
    </section>

    <div id="generic_price_table">
    <div className="wave">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
  <path fill="#fff" fill-opacity="1" d="M0,320L40,304C80,288,160,256,240,208C320,160,400,96,480,96C560,96,640,160,720,197.3C800,235,880,245,960,224C1040,203,1120,149,1200,133.3C1280,117,1360,139,1400,149.3L1440,160L1440,0L1400,0C1360,0,1280,0,1200,0C1120,0,1040,0,960,0C880,0,800,0,720,0C640,0,560,0,480,0C400,0,320,0,240,0C160,0,80,0,40,0L0,0Z"></path>
</svg>
  </div>
  <section>

          <div class="container center">
          <h2>{service} Pricing</h2>
              {/*BLOCK ROW START*/}
              <div class="PriceRow">
                  <div class="col-md-4">

                    {/*PRICE CONTENT START*/}
                      <div class="generic_content clearfix">

                          {/*HEAD PRICE DETAIL START*/}
                          <div class="generic_head_price clearfix">

                              {/*HEAD CONTENT START*/}
                              <div class="generic_head_content clearfix">

                                {/*HEAD START*/}
                                  <div class="head_bg"></div>
                                  <div class="head">
                                      <span>{planTitle_A}</span>
                                  </div>
                                  {/*//HEAD END*/}

                              </div>
                              {/*//HEAD CONTENT END*/}

                              {/*PRICE START*/}
                              <div class="generic_price_tag clearfix">
                                  <span class="price">
                                  <span class="sign">$</span>
                                  <span class="currency">{planPrice_A}</span>
                                  <span class="cent"></span>
                                  <span class="month">/mo</span>
                                      <span></span>
                                  </span>
                              </div>
                              {/*//PRICE END*/}

                          </div>
                          {/*//HEAD PRICE DETAIL END*/}

                          {/*FEATURE LIST START*/}
                          <div class="generic_feature_list">
                            <ul>
                                  <li>{planFeature01_A}</li>
                                  <li><span></span> {planFeature02_A}</li>
                                  <li><span></span> {planFeature03_A}</li>
                                  <li><span>2</span> {planFeature04_A}</li>
                                  <li><span>5</span> {planFeature05_A}</li>

                              </ul>
                          </div>
                          {/*//FEATURE LIST END*/}

                            {/*BUTTON START*/}
                            <section className="section">
                              <div className="container">
                                <Popup>
                                  <Content source={section1} />
                                </Popup>
                              </div>
                            </section>
                            {/*//BUTTON END*/}

                      </div>
                      {/*//PRICE CONTENT END*/}

                  </div>

                  <div class="col-md-4">

                    {/*PRICE CONTENT START*/}
                      <div class="generic_content active clearfix">

                          {/*HEAD PRICE DETAIL START*/}
                          <div class="generic_head_price clearfix">

                              {/*HEAD CONTENT START*/}
                              <div class="generic_head_content clearfix">

                                {/*HEAD START*/}
                                  <div class="head_bg"></div>
                                  <div class="head">
                                      <span>{planTitle_B}</span>
                                  </div>
                                  {/*//HEAD END*/}

                              </div>
                              {/*//HEAD CONTENT END*/}

                              {/*PRICE START*/}
                              <div class="generic_price_tag clearfix">
                                  <span class="price">
                                  <span class="sign">$</span>
                                  <span class="currency">{planPrice_B}</span>
                                  <span class="cent"></span>
                                  <span class="month">/mo</span>
                                      <span></span>
                                  </span>
                              </div>
                              {/*//PRICE END*/}

                          </div>
                          {/*//HEAD PRICE DETAIL END*/}

                          {/*FEATURE LIST START*/}
                          <div class="generic_feature_list">
                            <ul>
                            <li>{planFeature01_B}</li>
                            <li><span></span> {planFeature02_B}</li>
                            <li><span></span> {planFeature03_B}</li>
                            <li><span>5</span> {planFeature04_B}</li>
                            <li><span>10</span> {planFeature05_B}</li>
                            <li><span>1</span> {planFeature06_B}</li>
                              </ul>
                          </div>
                          {/*//FEATURE LIST END*/}

                            {/*BUTTON START*/}
                            <section className="section">
                              <div className="container">
                                <Popup>
                                  <Content source={section1} />
                                </Popup>
                              </div>
                            </section>
                            {/*//BUTTON END*/}

                      </div>
                      {/*//PRICE CONTENT END*/}

                  </div>
                  <div class="col-md-4">

                    {/*PRICE CONTENT START*/}
                      <div class="generic_content clearfix">

                          {/*HEAD PRICE DETAIL START*/}
                          <div class="generic_head_price clearfix">

                              {/*HEAD CONTENT START*/}
                              <div class="generic_head_content clearfix">

                                {/*HEAD START*/}
                                  <div class="head_bg"></div>
                                  <div class="head">
                                      <span>{planTitle_C}</span>
                                  </div>
                                  {/*//HEAD END*/}

                              </div>
                              {/*//HEAD CONTENT END*/}

                              {/*PRICE START*/}
                              <div class="generic_price_tag clearfix">
                                  <span class="price">
                                      <span class="sign">$</span>
                                      <span class="currency">{planPrice_C}</span>
                                      <span class="cent"></span>
                                      <span class="month">/mo</span>
                                  </span>
                              </div>
                              {/*//PRICE END*/}

                          </div>
                          {/*//HEAD PRICE DETAIL END*/}

                          {/*FEATURE LIST START*/}
                          <div class="generic_feature_list">
                            <ul>
                            <li>{planFeature01_C}</li>
                            <li><span></span> {planFeature02_C}</li>
                            <li><span></span> {planFeature03_C}</li>
                            <li><span>10</span> {planFeature04_C}</li>
                            <li><span>10</span> {planFeature05_C}</li>
                            <li><span>2</span> {planFeature06_C}</li>
                            <li><span>1</span> {planFeature07_C}</li>
                              </ul>
                          </div>
                          {/*//FEATURE LIST END*/}

                          {/*BUTTON START*/}
                          <section className="section">
                            <div className="container">
                              <Popup>
                                <Content source={section1} />
                              </Popup>
                            </div>
                          </section>
                          {/*//BUTTON END*/}

                      </div>
                      {/*//PRICE CONTENT END*/}

                  </div>
              </div>
              {/*//BLOCK ROW END*/}

          </div>

          <div className="waveBottom">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="#fff" fill-opacity="1" d="M0,64L80,53.3C160,43,320,21,480,21.3C640,21,800,43,960,48C1120,53,1280,43,1360,37.3L1440,32L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path></svg>
          </div>
      </section>

  </div>

  <section className="section ">
    <div className="container center">
      <h2>FAQs about {service}</h2><h3>Updated: {date}</h3>
      <Accordion items={accordion2} />
    </div>
  </section>



  <div id="generic_price_table">
  <div className="wave">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
  <path fill="#fff" fill-opacity="1" d="M0,128L40,117.3C80,107,160,85,240,117.3C320,149,400,235,480,261.3C560,288,640,256,720,224C800,192,880,160,960,170.7C1040,181,1120,235,1200,234.7C1280,235,1360,181,1400,154.7L1440,128L1440,0L1400,0C1360,0,1280,0,1200,0C1120,0,1040,0,960,0C880,0,800,0,720,0C640,0,560,0,480,0C400,0,320,0,240,0C160,0,80,0,40,0L0,0Z"></path>
</svg>
</div>

</div>

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
        service,
        planTitle_A
        planPrice_A
        planCTA_A
        planLink_A
        planFeature01_A
        planFeature02_A
        planFeature03_A
        planFeature04_A
        planFeature05_A
        planTitle_B
        planPrice_B
        planCTA_B
        planLink_B
        planFeature01_B
        planFeature02_B
        planFeature03_B
        planFeature04_B
        planFeature05_B
        planFeature06_B
        planTitle_C
        planPrice_C
        planCTA_C
        planLink_C
        planFeature01_C
        planFeature02_C
        planFeature03_C
        planFeature04_C
        planFeature05_C
        planFeature06_C
        planFeature07_C
        accordion {
          title
          description
        }
        accordion2 {
          title
          description
        }
      }
    }
  }

`

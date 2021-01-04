import React from 'react'
import { Link } from 'gatsby'

import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import ProductGrid from '../components/ProductGrid'

const ServicesPage = () => (
  <Layout title="Uncommon digital marketing for ecommerce" description="We help uncommon organizations grow with digital marketing services tailored specifically for ecommerce.">
    <PageHeader
        title="Uncommon digital marketing services for ecommerce"
      subtitle="We help uncommon organizations grow with digital marketing services tailored specifically for ecommerce."

      backgroundImage='../images/ecoomloop_clock_leverage.png'
    />
    <section className="section">
      <div className="container">
        <ProductGrid />
      </div>
    </section>
    <section className="section">
    <div className="container">

</div>
      <div className="hide">

      </div>
    </section>

  </Layout>
)

export default ServicesPage

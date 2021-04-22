import React from 'react'
import { Link } from 'gatsby'

import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import ProductGrid from '../components/ProductGrid'

const ServicesPage = () => (
  <Layout title="digital agency services for small teams" description="ecomloop helps small teams deploy AI, crypto, web 3 & metaverse solutions">
    <PageHeader
        title="digital agency services for small teams"
      subtitle="ecomloop helps small teams deploy AI, crypto, web 3 & metaverse solutions"

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

import React from 'react'
import { Link } from 'gatsby'
import _ from 'lodash';
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import Image from '../components/Image'
import '../components/PostSection.css'
import '../components/PostCard.css'

const NewsPage = ({ data }) => {

    const { edges } = data.allGoogleSheetListRow;
    const maxItems = 9;
    const [limit, setLimit] = React.useState(maxItems);
    const [showMore, setShowMore] = React.useState(true);

    const increaseLimit = () => {
        setLimit(limit + maxItems);
    }

    //Now limiting the items as per limit
    const listEdges = _.slice(edges, 0, limit)

    return (
        <Layout title="ecommerce news" description="">
            <PageHeader
                title="ecommerce news"
                subtitle=""
            />
            <section className="section">
                <div className="container">
                    <div className="PostSection">
                        <div className="PostSection--Grid">
                            {listEdges && listEdges.map(({ node }, index) => (
                                <Link key={index} to={`/news/${_.kebabCase(node.id)}`} className="PostCard">
                                    {node.image && (
                                        <div className="PostCard--Image relative">
                                            <Image background src={node.image} alt={node.title} />
                                        </div>
                                    )}
                                    <div className="PostCard--Content">
                                        {node.title && <h3 className="PostCard--Title">{node.title}</h3>}
                                        {node.comment && <div className="PostCard--Excerpt">{node.comment}</div>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                        {showMore && listEdges.length > 0 && listEdges.length < edges.length &&
                            <div className="taCenter">
                                <button className="button" onClick={increaseLimit}>
                                    Load More
                                </button>
                            </div>
                        }
                    </div>
                </div>
            </section>
        </Layout>
    )
}

export default NewsPage

export const pageQuery = graphql`
  query MyQuery {
    allGoogleSheetListRow {
      edges {
        node {
          articleid
          author
          comment
          dateadded
          excerpt
          extractedkeywords
          highlight
          highlight2
          images
          image
          id
          keywords
          publishdate
          relativepopularity
          source
          source2
          tags
          text
          title
          url
        }
      }
    }
  }

`

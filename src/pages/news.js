import React from 'react'
import { Link } from 'gatsby'
import _ from 'lodash';
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import Image from '../components/Image'
import * as queryString from "query-string";
import '../components/PostSection.css'
import '../components/PostCard.css'

const NewsPage = ({location, data }) => {

    const { edges } = data.allGoogleSheetListRow;
    const maxItems = 9;
    const [limit, setLimit] = React.useState(maxItems);
    const [filter, setFilter] = React.useState("");
    const [showMore, setShowMore] = React.useState(true);

    const increaseLimit = () => {
        setLimit(limit + maxItems);
    }

    React.useEffect(() => {
      //checking if tag filter is present
      if(location && location.search) {
        const { tag } = queryString.parse(location.search);
        setFilter(tag.trim())
      }
    },[]);

    let filterEdges = edges;
    //apply filtertext if its greater than 3 characters
    if(filter && filter.length>3){
      filterEdges = _.filter(edges, ({node}) => (node.title && node.title.indexOf(filter)>=0) || (node.extractedkeywords && node.extractedkeywords.indexOf(filter)>=0) || (node.tags && node.tags.indexOf(filter)>=0) || (node.keywords && node.keywords.indexOf(filter)>=0) )
    }

    //Now limiting the items as per limit
    const listEdges = _.slice(filterEdges, 0, limit)

    return (
        <Layout title="ecommerce news" description="ecommerce news for uncommon digial commerce brands" >
            <PageHeader
                title="ecommerce news"
                subtitle="for uncommon digital commerce brands"
                backgroundImage="https://source.unsplash.com/1600x900/?abstract"
            />
            <section className="section">
                <div className="container">
                    <div className="section">
                      <div style={{float: "right"}}>
                      Search{`  `}
                      <input
                        placeholder=" filter news"
                        value={filter}
                        onChange={({ target: { value } }) => {
                          setFilter(value);
                        }}
                      />
                      </div>
                    </div>
                    <div className="PostSection">
                        <div className="PostSection--Grid">
                            {listEdges && listEdges.map(({ node }, index) => (
                                <Link key={index} to={`/news/${node.articleid}/`} className="PostCard">

                                        <div className="PostCard--Image relative">
                                            <Image background src={'https://source.unsplash.com/1600x900/?abstract.'+ node.articleid} alt={node.title} />
                                        </div>

                                    <div className="PostCard--Content">
                                        {node.title && <h3 className="PostCard--Title">{node.title.substring(0,50)}</h3>}
                                        {node.source && <em className="PostCard--Source">Source: {node.source.substring(0,28)}<br/></em>}
                                        {node.source && <em className="PostCard--Date">Date: {node.publishdate}<br/></em>}
                                        {node.highlight && <div className="PostCard--Excerpt"><br/>{node.highlight.substring(0,280)}</div>}
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
    allGoogleSheetListRow (sort: {fields: dateadded, order: DESC}) {
      edges {
        node {
          articleid
          author
          comment
          dateadded
          excerpt
          extractedkeywords
          headerimage
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

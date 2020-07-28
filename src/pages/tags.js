import React from 'react'
import { graphql, Link } from 'gatsby'
import PageHeader from '../components/PageHeader'
import Layout from '../components/Layout'
import _ from 'lodash'

const Tags = ({ data }) => {

  const allUniqueTags = [];
  
  //Filtering Posts as per the tag
  const postEdges = data.allPosts.edges;      
  postEdges.map((edge)=>{
    if(edge.node.frontmatter.tags) {
      edge.node.frontmatter.tags.map((tag)=>{
        //tag = tag.trim();
        if(allUniqueTags.indexOf(tag.toLowerCase())<0) allUniqueTags.push(tag.toLowerCase());
      });        
    }
  });
  
  //Now sorting alphabetically
  const sortedUniqueTags = _.sortBy(allUniqueTags, obj=>obj.toLowerCase())
  
  const filterPostsByTag = (tag) => {    
    return _.filter(postEdges, ({ node }) => _.transform(node.frontmatter.tags, function(result, n, key) {result[key] = n.toLowerCase();}).includes(tag.toLowerCase()));
  }  
  
  return (
    <Layout title="All Tags">            
      <div className="container skinny">
        {sortedUniqueTags.map((item,index)=>{
          return (
            <>
              <h2>{item} - ({filterPostsByTag(item).length})</h2>
              <ul>
              {filterPostsByTag(item).map(({node})=>(
                <li><Link to={node.fields.slug}>{node.frontmatter.title}</Link></li>
              ))}
              </ul>
            </>
        )})}                        
      </div>
    </Layout >
  )
}

export default Tags

export const pageQuery = graphql`
  query  {
    allPosts: allMarkdownRemark(
      filter: { fields: { contentType: { eq: "posts" } } }
      sort: { order: DESC, fields: [frontmatter___date] }
    ) {
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            title
            tags
          }
        }
      }
    }
  }
`

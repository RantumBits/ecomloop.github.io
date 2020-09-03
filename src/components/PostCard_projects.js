import React from 'react'
import { Link } from 'gatsby'

import Image from './Image'
import GatsbyImage from 'gatsby-image';
import './PostCard.css'

const PostCard = ({
  featuredImage,
  localImage,
  title,
  excerpt,
  date,
  client,
  slug,
  categories = [],
  className = '',
  ...props
}) => (
  <Link to={slug} className={`PostCard ${className}`}>
    {localImage && (
      <div className="PostCard--Image relative">
        <GatsbyImage fluid={localImage.childImageSharp.fluid} alt={title} />
      </div>
    )}
    {!localImage && featuredImage && (
      <div className="PostCard--Image relative">
        <Image background src={featuredImage} alt={title} />
      </div>
    )}
    <div className="PostCard--Content">
      {title && <h3 className="PostCard--Title">{title}</h3>}
      <div className="PostCard--Category">
      Client: {client} | {date}  <br/>


      </div>
      <div className="PostCard--Date">

      </div>
      {excerpt && <div className="PostCard--Excerpt">{excerpt}</div>}
    </div>
  </Link>
)

export default PostCard

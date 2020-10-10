import React from 'react'
import { includes, orderBy } from 'lodash'

export const getRelatedPosts = (currentPost, allPosts) => {

    const maxPosts = 3;
    const currentCatetory = currentPost.node.frontmatter.categories || "";
    const currentTags = currentPost.node.frontmatter.tags || [];

    // console.log("******** in related post")
    // console.log(allPosts)
    // console.log(currentPost)
    // console.log(currentCatetory)
    // console.log(currentTags)

    // Don't include the current post in posts list
    allPosts = allPosts.filter((post) => post.node.id !== currentPost.node.id);

    const identityMap = {};

    //Map over all posts, add to map and add points
    for (let post of allPosts) {

        const id = post.node.id;
        if (!identityMap.hasOwnProperty(id)) {
            identityMap[id] = {
                post: post,
                points: 0
            }
        }

        // For category matches, we add 2 points
        const categoryPoints = 2;
        //if (post.node.frontmatter.categories.category === currentCatetory) {
            //identityMap[id].points += categoryPoints;
        //}
        post.node.frontmatter.categories.forEach(({category}) => {
            if (includes(...currentCatetory, category)) {
                identityMap[id].points += categoryPoints;
            }
        })

        // For tags matches, we add 1 point
        const tagPoint = 1;
        post.node.frontmatter.tags.forEach((aTag) => {
            if (includes(currentTags, aTag)) {
                identityMap[id].points += tagPoint;
            }
        })

    }

    // Convert the identity map to an array
    const arrayIdentityMap = Object.keys(identityMap).map((id) => identityMap[id]);

    // Use a lodash utility function to sort them 
    // by points, from greatest to least
    const similarPosts = orderBy(
        arrayIdentityMap, ['points'], ['desc']
    )

    //console.log(similarPosts.splice(0, maxPosts))
    // return the max number posts requested
    return similarPosts.splice(0, maxPosts);

}
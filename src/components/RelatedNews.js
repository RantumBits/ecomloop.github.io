import React from 'react'
import { includes, orderBy } from 'lodash'

export const getRelatedNews = (currentNews, allNews) => {

    const maxPosts = 3;
    const currentCategories = (currentNews.extractedkeywords + "," + currentNews.keywords).split(",") || [];
    const currentTags = currentNews.tags.split(",") || [];

    /*
    console.log("******** in related news")
    console.log(allNews)
    console.log(currentNews)
    console.log(currentCategories)
    console.log(currentTags)
    */

    // Don't include the current post in posts list
    allNews = allNews.filter((post) => post.node.id !== currentNews.id);

    const identityMap = {};

    //Map over all posts, add to map and add points
    for (let post of allNews) {

        const id = post.node.id;
        if (!identityMap.hasOwnProperty(id)) {
            identityMap[id] = {
                news: post,
                points: 0
            }
        }

        // For category matches, we add 2 points
        const categoryPoints = 2;
        const categories = (post.node.extractedkeywords + "," + post.node.keywords).split(",") || [];
        categories.forEach((category) => {
            if (includes(...currentCategories, category)) {
                identityMap[id].points += categoryPoints;
            }
        })

        // For tags matches, we add 1 point
        const tagPoint = 1;
        const tags = post.node.tags.split(",") || [];
        tags.forEach((aTag) => {
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

    //console.log("***** relatedNews Output ",similarPosts.splice(0, maxPosts))
    // return the max number posts requested
    return similarPosts.splice(0, maxPosts);

}
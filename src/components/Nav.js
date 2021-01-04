import React, { Component } from 'react'
import { Location } from '@reach/router'
import { StaticQuery, graphql, Link } from 'gatsby'
import { Menu, X } from 'react-feather'
import Logo from './Logo'

import './Nav.css'

export class Navigation extends Component {
    state = {
        active: false,
        activeSubNav: false,
        currentPath: false
    }

    componentDidMount = () =>
        this.setState({ currentPath: this.props.location.pathname })

    handleMenuToggle = () => this.setState({ active: !this.state.active })

    // Only close nav if it is open
    handleLinkClick = () => this.state.active && this.handleMenuToggle()

    toggleSubNav = subNav =>
        this.setState({
            activeSubNav: this.state.activeSubNav === subNav ? false : subNav
        })

    render() {
        const { active } = this.state,
            { subNav, data } = this.props,
            NavLink = ({ to, className, children, ...props }) => (
                <Link
                    to={to}
                    className={`NavLink ${
                        to === this.state.currentPath ? 'active' : ''
                        } ${className}`}
                    onClick={this.handleLinkClick}
                    {...props}
                >
                    {children}
                </Link>
            )

        return (
            <nav className={`Nav ${active ? 'Nav-active' : ''}`}>
                <div className="Nav--Container container">
                    <Link to="/" onClick={this.handleLinkClick}>
                        <Logo />
                    </Link>
                    <div className="Nav--Links">

                        {
                            <div className={`Nav--Group ${this.state.activeSubNav === 'posts' ? 'active' : ''}`}>
                                <span
                                    className={`Nav--GroupParent ${this.props.location.pathname.includes('solution')? 'active': ''}`}
                                    onClick={() => this.toggleSubNav('posts')}
                                >
                                    digital marketing services
                                    <div className="Nav--GroupLinks">
                                        <NavLink to="/solutions/" className="Nav--GroupLink">
                                            All Solutions
                                        </NavLink>
                                        {subNav.products.map((link, index) => (
                                            <NavLink
                                            to={`/solution/${link.handle}/`}
                                            key={'posts-subnav-link-' + index}
                                            className="Nav--GroupLink"
                                            >
                                            {link.title}
                                            </NavLink>
                                        ))}
                                    </div>
                                </span>
                            </div>
                        }

                        {
                            <div className={`Nav--Group ${this.state.activeSubNav === 'tools' ? 'active' : ''}`}>
                                <span
                                    className={`Nav--GroupParent ${this.props.location.pathname.includes('tools')? 'active': ''}`}
                                    onClick={() => this.toggleSubNav('tools')}
                                >
                                    tools
                                    <div className="Nav--GroupLinks">


                                            <NavLink
                                            to={`https://headless.ecomloop.com/`}
                                            key={'headless'}
                                            className="Nav--GroupLink"
                                            target="_blank"
                                            >
                                            Headless // gatsby + shopify theme
                                            </NavLink>
                                            <NavLink
                                            to={`https://www.gatsbyjs.com/plugins/gatsby-plugin-klaviyo/`}
                                            key={'klatsby'}
                                            className="Nav--GroupLink"
                                            target="_blank"
                                            >
                                            Klatsby // klayvio plugin for gatsby
                                            </NavLink>
                                            <NavLink
                                            to={`#`}
                                            key={'#'}
                                            className="Nav--GroupLink"
                                            target="_blank"
                                            >
                                            Shoptomo // shopify analtyics app
                                            </NavLink>

                                    </div>
                                </span>
                            </div>
                        }

                        <NavLink to="/news/" title="ecommerce news">ecommerce news</NavLink>
                        <NavLink to="/blog/" title="ecommerce agency blog">blog</NavLink>

                        <NavLink to="/solutions/" title="digital commerce solutions" className="Nav--CTA animated rubberBand slow delay-5s">Get ecommerce help</NavLink>
                    </div>
                    <button
                        className="Nav--MenuButton"
                        onClick={this.handleMenuToggle}
                        to='/home'
                    >
                        {active ? <X /> : <Menu />}
                    </button>
                </div>
            </nav>
        )
    }
}

export default ({ subNav, data }) => (
    <Location>{route => <Navigation subNav={subNav} data={data} {...route} />}</Location>
)

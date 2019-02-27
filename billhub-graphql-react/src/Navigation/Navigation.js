import React from 'react';
import NavItem from './NavItem';

const Nav = (props) => {
  return (
    <header className="headerBackground">
      {/* BILLHUB HEADER */}
      <a className="navbar-brand">
        <img className="appIcon" src={"/images/gavel.png"} />
        <span className="brandName">BillHub</span>
      </a>

      <nav className="nav nav-fill">
        <NavItem setActivePage={props.setActivePage.bind(this)} path="tracking" />
        <NavItem setActivePage={props.setActivePage.bind(this)} path="trending" />
        <NavItem setActivePage={props.setActivePage.bind(this)} path="bills" />
        <NavItem setActivePage={props.setActivePage.bind(this)} path="legislators" />
      </nav>

    </header>
  )
}

export default Nav;
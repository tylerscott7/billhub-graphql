import React from 'react'
import { Button, ButtonGroup, Container, Col, Row, Input, InputGroup, Form, ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import statesArrayObj from '../statesArray';

const SearchBar = (props) => {
    
    // Making dropdown menu item for each state in array
    const statesArray = Object.entries(statesArrayObj);
    const dropdownItems = statesArray.map((state) => {
        return <DropdownItem name={state[0]} active={props.userState === state[0]}>{state[0]}</DropdownItem>
    })

    return (
        <Row>
            <Col xs={{ size: 'auto', offset: 0 }}>
                <ButtonGroup>

                    <ButtonDropdown isOpen={props.dropdownOpen} toggle={props.toggleDropdown.bind(this)}>
                        
                        <DropdownToggle caret color="primary">
                            {props.userState}
                        </DropdownToggle>

                        <DropdownMenu onClick={props.changeStateSelection.bind(this)}>
                            {dropdownItems}
                        </DropdownMenu>
                    </ButtonDropdown>
                </ButtonGroup>
            </Col>

            <Col xs={{ size: 'auto' }}>
                <Form 
                    className='searchBar' 
                    onSubmit={ props.page !== "legislators" ?
                        props.getBillsFromQuery.bind(this) : 
                        props.getRepsFromQuery.bind(this)}
                >

                    <InputGroup>
                        <Input placeholder="Search Bills" onChange={props.handleSearchInput.bind(this)} />
                        <Input type="Submit" value="Search" />
                    </InputGroup>
                </Form>
            </Col>
        </Row>
    )
}

export default SearchBar
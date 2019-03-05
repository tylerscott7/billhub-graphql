import React from 'react'
import { Col, Card, Label, Input, Form, FormGroup, Row } from 'reactstrap';

const Login = (props) => {
    return (
        <Row>
            <Col xs='auto'>
                <Card body>
                    <h3>Login</h3>
                    <Form onSubmit={props.handleLogin.bind(this)}>
                        <FormGroup>
                            <Label for="exampleEmail">Username</Label>
                            <Input type="text" name="username" autoComplete="off" id="exampleUsername" placeholder="" onChange={props.handleChange.bind(this)} />
                        </FormGroup>

                        <FormGroup>
                            <Label for="examplePassword">Password</Label>
                            <Input type="password" name="password" autoComplete="off" id="examplePassword" placeholder="" onChange={props.handleChange.bind(this)} />
                        </FormGroup>
                        <Input className="submit" type="Submit" value="Login" />
                    </Form>

                    <h3>Register</h3>
                    <Form onSubmit={props.handleRegister.bind(this)}>
                        <FormGroup>
                            <Label for="exampleEmail">Username</Label>
                            <Input type="text" name="username" autoComplete="off" id="exampleUsername" placeholder="" onChange={props.handleChange.bind(this)} />
                        </FormGroup>

                        <FormGroup>
                            <Label for="examplePassword">Password</Label>
                            <Input type="password" name="password" autoComplete="off" id="examplePassword" placeholder="" onChange={props.handleChange.bind(this)} />
                        </FormGroup>
                        <Input className="submit" type="Submit" value="Register" />
                    </Form>

                </Card>
            </Col>
        </Row>
    )
}

export default Login
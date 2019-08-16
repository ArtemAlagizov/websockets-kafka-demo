import React, {Component} from "react";
import {Icon, List, Row, Steps} from "antd";
import {isEmpty, range} from "ramda";
import axios from "axios";
import "./style.css";
import "antd/dist/antd.css";

import AuthService from "../../utils/AuthService";
import withAuth from "../../utils/withAuth";
import CableApp from "../../utils/CableService";

const Auth = new AuthService();
const Step = Steps.Step;
const gatewayUrl = `http://${process.env.REACT_APP_TB_IP}:${process.env.REACT_APP_GATEWAY_PORT}`

class App extends Component {
    state = {
        jobs: []
    };

    handleLogout() {
        Auth.logout();

        this.props.history.replace('/login');
    }

    componentDidMount() {
        CableApp.cable.subscriptions.create({channel: 'WebNotificationsChannel', id: this.props.user.username}, {
            received: data => {
                this.updateJobs(data)
            }
        });
        CableApp.cable.subscriptions.create('JobsChannel', {
            received: data => {
                this.updateJobs(data)
            }
        })

        this.setCurrentJobs();
    }

    componentWillUnmount() {
        CableApp.cable.subscriptions.remove({channel: 'WebNotificationsChannel', id: this.props.user.username}, {
            received: data => {
                this.updateJobs(data)
            }
        });
    }

    setCurrentJobs = () => {
        axios.get(`${gatewayUrl}/perform?userId=${this.props.user.username}`)
            .then(data => {
                console.log(data)

                this.setState({jobs: isEmpty(data.data) ? [] : data.data})
            })
            .catch(e => console.log(e));
    }

    updateJobs = data => {
        console.log("received data through ws!")
        console.log(data)
        const jobs = this.state.jobs;
        const updatedJob = data.job;
        const foundIndex = jobs.findIndex(job => job.jobId === updatedJob.jobId);

        if (foundIndex === -1) {
            jobs.push(updatedJob);
        } else {
            jobs.splice(foundIndex, 1, updatedJob);
        }

        this.setState({jobs: jobs});
    }

    handleStartComputation = () => axios.post(`${gatewayUrl}/perform`, {
        userId: this.props.user.username
    })
        .then(r => console.log(r))
        .catch(e => console.log(e));

    handleRemoveAllJobs = () => axios.delete(`${gatewayUrl}/perform/all`)
        .then(() => this.setCurrentJobs())
        .catch(e => console.log(e));

    render() {
        const serverError = this.state.serverError ?
            <div
                className="server-error">{this.state.serverError}</div> : '';
        const waitingState = {state: 'wait', icon: 'pause-circle', iconColor: 'grey'}
        const processingState = {state: 'process', icon: 'clock-circle', iconColor: 'orange'}
        const finishedState = {state: 'finish', icon: 'check-circle', iconColor: '#1890FF'}

        const steps = item => range(0, 7).map((stepNumber, i) => {
            const job = item;
            const currentStep = job.jobStep;
            const isJobDone = job.isJobDone;
            let state;

            if (stepNumber < currentStep) state = finishedState;
            if (stepNumber === currentStep) state = processingState;
            if (stepNumber > currentStep) state = waitingState;
            if (isJobDone) state = finishedState;

            return <Step key={i} status={state.state} title={`Step ${stepNumber}`}
                         icon={<Icon type={state.icon} theme="twoTone" twoToneColor={state.iconColor}/>}/>
        });

        const josSteps = isEmpty(this.state.jobs) ? '' :
            <Row>
                <div className="strategy-list-item-container">
                    <List
                        itemLayout="horizontal"
                        dataSource={this.state.jobs}
                        renderItem={item => (
                            <div className="strategy">
                                <div className="strategy-info">
                                    <div className="strategy-info-label">Status:</div>
                                    {item.isJobDone ? "Finished" : `At step ${item.jobStep}`}
                                    <div className="strategy-info-label">Triggered by:</div>
                                    {item.userId}
                                    <div className="strategy-info-label">Job id:</div>
                                    {item.jobId}
                                </div>
                                <Steps>
                                    {steps(item)}
                                </Steps>
                            </div>
                        )}
                    />

                </div>
            </Row>;

        const adminButton = this.props.user.username === 'rabbit-admin' ?
            <button type="button" className="form-submit" onClick={this.handleRemoveAllJobs.bind(this)}>
                Remove all jobs
            </button> : '';

        return (
            <div className="wrapper">
                <div className={this.state.isLoading ? 'overlay' : 'hidden'}/>
                <div className={this.state.isLoading ? 'loader-container' : 'hidden'}>

                </div>
                <div className="header">
                    <div className="header-welcome">
                        Welcome {this.props.user.username}
                    </div>
                    {serverError}
                    <button type="button" className="form-submit logout-button" onClick={this.handleLogout.bind(this)}>
                        Logout
                    </button>
                </div>
                <div className="App">
                    {josSteps}
                </div>
                <div className="footer">
                    {adminButton}
                    <button type="button" className="form-submit" onClick={this.handleStartComputation.bind(this)}>
                        Start a Job of 7 steps
                    </button>
                </div>
            </div>
        );
    }
}

export default withAuth(App);

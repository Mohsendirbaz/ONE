import React, { useState } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import ProbingIntegrationUI from './integration-ui';
import './home.css';

/**
 * Home component that serves as the main container for the probing module
 * It uses react-tabs to organize the different components under tabs
 */
const Home = () => {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <div className="probing-home">
      <header className="probing-header">
        <h1>Probing Module</h1>
        <p>A comprehensive tool for code and financial entity analysis</p>
      </header>

      <main className="probing-main">
        <Tabs selectedIndex={tabIndex} onSelect={index => setTabIndex(index)}>
          <TabList>
            <Tab>Integrated View</Tab>
            <Tab>Financial Visualizations</Tab>
            <Tab>Code Analysis</Tab>
            <Tab>File Associations</Tab>
            <Tab>Insights</Tab>
          </TabList>

          <TabPanel>
            <div className="tab-content">
              <h2>Integrated Probing Interface</h2>
              <p>This view combines all probing functionality in a single interface.</p>
              <ProbingIntegrationUI />
            </div>
          </TabPanel>

          <TabPanel>
            <div className="tab-content">
              <h2>Financial Entity Visualizations</h2>
              <p>Visualize financial entities and their relationships.</p>
              <ProbingIntegrationUI initialTab="visualizations" />
            </div>
          </TabPanel>

          <TabPanel>
            <div className="tab-content">
              <h2>Code Entity Analysis</h2>
              <p>Analyze code entities and their dependencies.</p>
              <ProbingIntegrationUI initialTab="code-analysis" />
            </div>
          </TabPanel>

          <TabPanel>
            <div className="tab-content">
              <h2>File Associations</h2>
              <p>Explore file associations and dependencies.</p>
              <ProbingIntegrationUI initialTab="file-associations" />
            </div>
          </TabPanel>

          <TabPanel>
            <div className="tab-content">
              <h2>Insights Generator</h2>
              <p>Generate insights from code and financial data.</p>
              <ProbingIntegrationUI initialTab="insights" />
            </div>
          </TabPanel>
        </Tabs>
      </main>

      <footer className="probing-footer">
        <p>Probing Module &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default Home;

import React, { useState } from 'react';

const StationStatusMonitor = ({ stations }) => {
  const [filter, setFilter] = useState('all');

  const filteredStations = stations.filter(station => {
    if (filter === 'all') return true;
    return station.status === filter;
  });

  return (
    <div className="station-monitor">
      <div className="station-filter">
        <label htmlFor="station-status-filter">Filter by status:</label>
        <select
          id="station-status-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Stations</option>
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="offline">Offline</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="station-list">
        <table className="station-table">
          <thead>
            <tr>
              <th>Station Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Current Load</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStations.map(station => (
              <tr
                key={station.id}
                className={`station-row ${station.status}`}
              >
                <td className="station-name">{station.name}</td>
                <td>
                  <span className={`station-type ${station.type}`}>
                    {station.type}
                  </span>
                </td>
                <td>
                  <span className={`status-indicator ${station.status}`}>
                    {station.status}
                  </span>
                </td>
                <td>{new Date(station.lastUpdated).toLocaleString()}</td>
                <td>
                  <div className="load-bar-container">
                    <div
                      className="load-bar"
                      style={{ width: `${station.currentLoad}%` }}
                    ></div>
                    <span className="load-text">{station.currentLoad}%</span>
                  </div>
                </td>
                <td>
                  <button className="action-btn view-btn">View Details</button>
                  <button className="action-btn reset-btn">Reset</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStations.length === 0 && (
          <div className="no-stations">
            No stations match the current filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default StationStatusMonitor;
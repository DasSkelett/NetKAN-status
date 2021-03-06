import React from 'react';
import {Table, Column, Cell} from 'fixed-data-table';
import $ from 'jquery';

import renderDate from '../lib/renderDate.js';

export default class NetKANs extends React.Component {
  constructor(props) {
    super(props);
    this.loadNetKANsFromServer = this.loadNetKANsFromServer.bind(this);
    this._updateSort = this._updateSort.bind(this);
    this._onResize = this._onResize.bind(this);
    this._updateTableSize = this._updateTableSize.bind(this);
    this._onFilterChange = this._onFilterChange.bind(this);
    this.state = {
      data: [],
      filterText: '',
      tableWidth: 200,
      tableHeight: 500,
      filterBy: 'failed',
      filterId: null,
      sortBy: 'last_error',
      sortDir: 'DESC'
    }

    if (window.addEventListener) {
      window.addEventListener('resize', this._onResize, false);
    } else if (window.attachEvent) {
      window.attachEvent('onresize', this._onResize);
    } else {
      window.onresize = this._onResize;
    }
    setInterval(this.loadNetKANsFromServer, this.props.pollInterval);
    this.loadNetKANsFromServer();
  }
  loadNetKANsFromServer() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: 'false',
      success: (data) => {
        const netkan = Object.keys(data).map((key) => {
          const item = data[key] ? data[key] : {};
          item.id = key;
          return item;
        });
        this.setState({data: netkan});
        this._updateTableSize();
      },
      error: (xhr, status, err) => {
        console.error(this.props.url, status, err.toString());
      }
    });
  }
  _updateSort(key) {
    const sortDir = key === this.state.sortBy ?
      (this.state.sortDir === 'ASC' ? 'DESC' : 'ASC') : 'DESC';

    this.setState({
      sortBy: key,
      sortDir: sortDir
    });
  }
  _onResize() {
    clearTimeout(this._updateTimer);
    this._updateTimer = setTimeout(this._updateTableSize, 16);
  }
  _updateTableSize() {
    const widthOffset = window.innerWidth < 680 ? 0 : 10;
    this.setState({
      tableWidth: window.innerWidth - widthOffset,
      tableHeight: window.innerHeight - 45,
    });
  }
  _onFilterChange(e) {
    this.setState({
      filterId: e.target.value
    });
  }
  _sortDirArrow(key) {
    if (key !== this.state.sortBy) {
        return '';
    }
    return this.state.sortDir === 'DESC' ? ' ▾' : ' ▴';
  }
  _header(key, name) {
    return <Cell onClick={this._updateSort.bind(null, key)}>{name} {this._sortDirArrow(key)}</Cell>;
  }
  _resourcesList({id, resources}) {
    var val = [
        <a href={"https://github.com/KSP-CKAN/NetKAN/commits/master/NetKAN/" + id + ".netkan"}>history</a>,
        " | ",
        <a href={"https://github.com/KSP-CKAN/CKAN-meta/tree/master/" + id}>metadata</a>
    ];
    if (resources) {
      for (const key of Object.keys(resources).filter(name => !name.startsWith('x_')).sort()) {
        val.push(' | ');
        val.push(<a href={resources[key]}>{key}</a>);
      }
    }
    return val;
  }
  _toggleTheme() {
      var classes = document.body.classList;
      classes.toggle('lightTheme');
      classes.toggle('darkTheme');
      window.localStorage.setItem('darkTheme', classes.contains('darkTheme'));
  }
  render() {
    const sortBy = this.state.sortBy;
    const sortDir = this.state.sortDir;

    const rows = this.state.filterId ?
      this.state.data.filter((row) => {
          var filt = this.state.filterId.toLowerCase();
        return (row['id'].toLowerCase().indexOf(filt) !== -1)
          || (row['last_error'] && row['last_error'].toLowerCase().indexOf(filt) !== -1);
      }) : this.state.data;

    rows.sort((a, b) => {
      let sortVal = 0;
      var aVal = a[sortBy] ? a[sortBy].toLowerCase() : '';
      var bVal = b[sortBy] ? b[sortBy].toLowerCase() : '';
      if (aVal > bVal) {
        sortVal = 1;
      } else if (aVal < bVal) {
        sortVal = -1;
      } else if (sortBy !== 'id') {
        sortVal = a.id < b.id ?  1
                : a.id > b.id ? -1
                :                0;
      }
      return sortDir === 'DESC' ? sortVal * -1 : sortVal;
    });

    const divstyle = {
      fontSize:        '9pt',
      fontFamily:      'sans-serif',
      padding:         '5px',
    };
    const h1style = {
      fontSize:           '16pt',
      margin:             '0',
      padding:            '5px 0',
      paddingLeft:        '72px',
      backgroundImage:    'url(favicon.ico)',
      backgroundPosition: 'left center',
      backgroundRepeat:   'no-repeat',
    };
    const inputstyle = {
      float:    'right',
      margin:   '1px 5px',
      width:    '20em',
      fontSize: '11pt',
      padding:  '1px 3px',
    };
    const buttonstyle = {
      float:    'right',
      margin:   '1px 5px',
    };

    return (
      <div style={divstyle} className="outer">
        <input onChange={this._onFilterChange} placeholder='filter...' style={inputstyle} autoFocus='true' type='search' />
        <button onClick={this._toggleTheme} style={buttonstyle} title="Toggle theme">
          <span className="darkOnly">☀</span>
          <span className="lightOnly">🌙</span>
        </button>
        <h1 style={h1style}>NetKANs Indexed</h1>
        <Table
          rowHeight={40}
          headerHeight={30}
          rowsCount={rows.length}
          width={this.state.tableWidth}
          height={this.state.tableHeight}
          overflowX="auto"
          overflowY="auto">
          <Column
            header={this._header('id', 'NetKAN')}
            cell={({rowIndex, ...props}) => (
              <Cell {...props}>
                <a href={"https://github.com/KSP-CKAN/NetKAN/tree/master/NetKAN/" + rows[rowIndex].id + ".netkan"}>{rows[rowIndex].id}</a>
                <div className="moduleMenu">{this._resourcesList(rows[rowIndex])}</div>
              </Cell>
            )}
            fixed={true}
            width={250}
            flexGrow={1}
          />
          <Column
            header={this._header('last_checked', 'Last Checked')}
            cell={({rowIndex, ...props}) => (<Cell {...props}>{renderDate(rows[rowIndex].last_checked)}</Cell>)}
            fixed={true}
            width={120}
            flexGrow={0}
          />
          <Column
            header={this._header('last_inflated', 'Last Inflated')}
            cell={({rowIndex, ...props}) => (<Cell {...props}>{renderDate(rows[rowIndex].last_inflated)}</Cell>)}
            fixed={true}
            width={120}
            flexGrow={0}
          />
          <Column
            header={this._header('last_indexed', 'Last Indexed')}
            cell={({rowIndex, ...props}) => (<Cell {...props}>{renderDate(rows[rowIndex].last_indexed)}</Cell>)}
            fixed={true}
            width={120}
            flexGrow={0}
          />
          <Column
            header={this._header('last_error', 'Error')}
            cell={({rowIndex, ...props}) => (<Cell className="error" {...props}>{rows[rowIndex].last_error}</Cell>)}
            fixed={false}
            width={200}
            flexGrow={4}
          />
        </Table>
      </div>
    );
  }
};

import React from 'react'

export default class Comments extends React.PureComponent {
  constructor(props) {
    super(props)
    this.myRef = React.createRef()
  }

  componentDidMount() {
    const scriptEl = document.createElement('script')
    scriptEl.src = 'https://utteranc.es/client.js'
    scriptEl.async = true
    scriptEl.setAttribute('repo', 'overengineered/blog')
    scriptEl.setAttribute('crossorigin', 'anonymous')
    scriptEl.setAttribute('label', 'blog-comment')
    scriptEl.setAttribute('theme', 'github-light')
    scriptEl.setAttribute('issue-term', 'pathname')
    this.myRef.current.appendChild(scriptEl)
  }

  render() {
    return <div key="comments" ref={this.myRef}/>;
  }
}

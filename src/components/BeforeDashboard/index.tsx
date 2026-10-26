import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import './index.scss'

const baseClass = 'before-dashboard'

/** Welcome panel at the top of the admin dashboard. */
const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Welcome to the Printribe admin</h4>
      </Banner>
      Quick links:
      <ul className={`${baseClass}__instructions`}>
        <li>
          Edit the homepage under <a href="/admin/collections/pages">Pages</a>, then open <b>Home</b> and use the
          Content tab. Sections can be edited, reordered, added or removed.
        </li>
        <li>
          Write articles under <a href="/admin/collections/posts">Posts</a>.
        </li>
        <li>
          Change the top menu and announcement strip under <a href="/admin/globals/header">Header</a>, and the bottom
          links under <a href="/admin/globals/footer">Footer</a>.
        </li>
        <li>
          Upload photos, logos and videos under <a href="/admin/collections/media">Media</a>.
        </li>
        <li>
          See who signed up for the newsletter or the Design Studio list under{' '}
          <a href="/admin/collections/subscribers">Subscribers</a>.
        </li>
      </ul>
      <a href="/" target="_blank">
        Open the website
      </a>{' '}
      to see your changes.
    </div>
  )
}

export default BeforeDashboard

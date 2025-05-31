import React from 'react';

function MemberDate({ timestamp }) {
  const date = new Date(timestamp);
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();

  return (
    <p>Member since {month} {year}</p>
  );
}

export default MemberDate;
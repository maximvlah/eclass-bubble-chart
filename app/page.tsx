"use client";
import React from 'react';
import BubbleChart from './BubbleChart';
import data from './data.json';

export default function Home() {

  const parentWidth = window.innerWidth - 150; //150 is the width of the sidebar

  return (
    <main>
      <BubbleChart parentWidth={parentWidth} data={data} />
    </main>
  );
}

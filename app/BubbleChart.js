"use client";
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

import { usePathname } from 'next/navigation';

import { RxReset } from "@react-icons/all-files/rx/RxReset";

import {
  Modal, 
  ModalContent, 
  ModalBody, 
  useDisclosure,
  Progress,
} from "@nextui-org/react";


const PALLETE = [

  "rgba(204, 201, 220, 0.8)",
  "rgba(110, 117, 168, 0.7)",
  "rgba(205, 185, 0, 0.7)",
  "rgba(88, 139, 139, 0.7)",
  "rgba(151, 177, 166, 0.7)",
  "rgba(251, 108, 107, 0.7)",
  "rgba(167, 126, 88, 0.7)",
  "rgba(30, 227, 144, 0.8)",
  "rgba(111, 146, 131, 0.8)",
  "rgba(148, 68, 254, 0.7)",
  "rgba(231, 173, 153, 0.9)",

];

function BubbleChart({ data, parentWidth }) {

  const { onOpenChange } = useDisclosure();

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [selectedEclass, setSelectedEclass] = useState(null);
  const [selectedEclassName, setSelectedEclassName] = useState(null);

  const [selectedParentsClasses, setSelectedParentsClasses] = useState([]);

  const svgRef = useRef();
  const legendRef = useRef();

  const divRef = useRef(null);

  const pathname = usePathname();

  const color = d3.scaleLinear()
  .domain([0, 5])
  .range(["hsl(179, 25%, 66%", "hsl(221, 44%, 19%)"])
  .interpolate(d3.interpolateHcl);

  let colorCounter = 0;
  let colorMap = {};
  // const chooseColor = (d) => {
  //   if (d) {
  //     // console.log(d);
  //     colorMap[d.data.id] = PALLETE[colorCounter];
  //     const color = PALLETE[colorCounter];
  //     colorCounter = (colorCounter + 1);
  //     if (colorCounter === PALLETE.length - 1) {
  //       colorCounter = 0;
  //     }
  //     return color;
  //   } else {
  //     return "#f1f5f9";
  //   }
  // };

  const chooseColor = (d) => {
    if (d) {
      // console.log(d);

      let color;
      if (d.parentt) {

        //make it lighter
        let parentColor = colorMap[d.parent.data.id]
        if (parentColor) {

          // extract opacity from color
          const splits = parentColor.split(",");
          const opacity = splits[splits.length - 1].replace(")", "").replace(" ", "")
          const opacityFloat = parseFloat(opacity);

          const newOpacity = (Math.abs(opacityFloat - 0.3) +0.1).toFixed(1);
          const newColor = parentColor.replace(opacity, newOpacity.toString())
          // console.log(opacity, newOpacity);

          if (!colorMap[d.data.id]) {
            colorMap[d.data.id] = newColor;
            return newColor;
          } else {
            return colorMap[d.data.id];
          }
          
        } else {
          colorMap[d.data.id] = PALLETE[colorCounter];
          color = PALLETE[colorCounter];
          colorCounter = (colorCounter + 1);
          if (colorCounter === PALLETE.length - 1) {
            colorCounter = 0;
          }
          return color;
        }

      } else {
        colorMap[d.data.id] = PALLETE[colorCounter];
        color = PALLETE[colorCounter];
        colorCounter = (colorCounter + 1);
        if (colorCounter === PALLETE.length - 1) {
          colorCounter = 0;
        }
        return color;
      }

    } else {
      return "#f1f5f9";
    }
  };

  const getTextWidth = (text, font) => {
    // Re-use canvas object for better performance
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
  }

  useEffect(() => {
    const width = parentWidth; //1380
    const height = width;

    const color = d3.scaleLinear()
      .domain([4, 0])
      .range(["hsl(210,91%,60%)", "hsl(217, 71%, 91%)"])
      .interpolate(d3.interpolateHcl);

    const pack = data => d3.pack()
      .size([width, height])
      .padding(3)
      (d3.hierarchy(data)
        .sum(d => d.sumGrossAmountValue)
        .sort((a, b) => b.sumGrossAmountValue - a.sumGrossAmountValue));
    const root = pack(data);

    const svg = d3.select(svgRef.current)
      .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
      .attr("width", "95%")
      .attr("height", height)
    //   .attr("style", `max-width: 100%; height: auto; display: block; margin: 0 -14px; background: ${color(0)}; cursor: pointer;`);
    .attr("style", `max-width: 100%; height: auto; display: block; margin: 10px; background: #fff; cursor: pointer; overflow: hidden;`);

    const tooltip = d3.select(divRef.current)
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style("pointer-events", "none");

    const node = svg.append("g")
      .selectAll("circle")
      .data(root.descendants().slice(1))
      .join("circle")
        // .attr("fill", d => chooseColor(d))
        // .attr("fill", d => d.children ? color(d.depth) : "#f1f5f9")
        .attr("fill", d => {
          const c = color(d.depth)
          // console.log(c)
          colorMap[d.data.id] = c;
          return c
        })
        // .attr("pointer-events", d => !d.children ? "none" : null)
        .on("mouseover", function(event, d) { 

          tooltip.transition()
            .duration(100)
            .style("opacity", .9);
          tooltip.html(`
            <b>ECLASS Level:</b> ${d.data?.level}</br>
            <b>ECLASS ID:</b> ${d.data?.id}</br>
            <b>Summe Gross Amount Value:<b/> ${parseInt(d.data.sumGrossAmountValue)}</br>
            <b>Summe Net Amount Value:<b/> ${parseInt(d.data.sumNetAmountValue)}</br>
            <b>Summe Total Price Value:<b/> ${parseInt(d.data.sumTotalPriceValue)}</br>
            <b>Count:</b> ${d.data.count}</br>
            ${
              d.data?.level === 4 ? `<b className='underline'>Kategorie:</b> </br> ${"  "}${d.parent.parent.parent.data?.name} -> </br> ${"  "}${d.parent.parent.data?.name} -> </br> ${"  "}${d.parent.data?.name} -> </br> ${"  "}<b>${d.data?.name}</b></br>`: ""
            }

            ${
              d.data?.level === 3 ? `<b className='underline'>Kategorie:</b> </br> ${"  "}${d.parent.parent.data?.name} -> </br> ${"  "}${d.parent.data?.name} -> </br> ${"  "}<b>${d.data?.name}</b></br>`: ""
            }

            ${
              d.data?.level === 2 ? `<b className='underline'>Kategorie:</b> </br> ${"  "}${d.parent.data?.name} -> </br> ${"  "}<b>${d.data?.name}</b></br>`: ""
            }

            ${
              d.data?.level === 1 ? `<b className='underline'>Kategorie:</b> </br> ${"  "}<b>${d.data?.name}</b></br>`: ""
            }`
          )
          .style("left", (event.pageX).toString() + "px")
          .style("top", (event.pageY).toString() + "px");

          d3.select(this).attr("stroke", "#000"); 
        })
        .on("mouseout", function(event, d) { 
          tooltip.transition()
            .duration(100)
            .style("opacity", 0);

          d3.select(this).attr("stroke", null); 
        })
        .attr("cursor", "pointer")
        .on("click", (event, d) => {
          setSelectedEclass(d.data?.id);
          setSelectedEclassName(d.data?.name);
          setSelectedParentsClasses([
            d.parent?.parent?.parent?.data?.id?.toFixed(1), 
            d.parent?.parent?.data?.id?.toFixed(1), 
            d.parent?.data?.id?.toFixed(1), 
            d.data?.id?.toFixed(1)]);

          if (d.children) {
            focus !== d && (zoom(event, d), event.stopPropagation());
          } else {
            // console.log("no children")
          }
        })

    const label = svg.append("g")
      .style("font", "10px")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants())
      .join("text")
        .style("fill-opacity", d => d.parent === root ? 1 : 0)
        .style("display", d => d.parent === root ? "inline" : "none")
        .style("font-size", "16px")
        .style("font-family", "Arial")
        .text(d => `${d.data.percentageGrossAmountValue ? d.data.percentageGrossAmountValue.toFixed(3).toString() +"%" : ''}`)
            
      const legendSvg = d3.select(legendRef.current);

      function updateLegend(focus) {
        // Clear the current legend
        legendSvg.selectAll("*").remove();

        // Get the descendants of the current focus node
        // const descendants = focus.descendants().slice(1);
        const descendants = focus.children;

        // Calculate the number of items per column
        const itemsPerColumn = Math.ceil(descendants.length / 3);

        // For each descendant, append a rectangle and a text element to the legend SVG
        descendants.forEach((d, i) => {
          // Calculate the column index
          const columnIndex = Math.floor(i / itemsPerColumn);

          // Calculate the x position based on the column index
          let x = columnIndex * parseInt(parentWidth / 3);
          if (columnIndex === 0) {
            x += 10;
          }

          // Calculate the y position based on the item index within the column
          const y = (i % itemsPerColumn) * 30;

          const text = `${d.data.percentageGrossAmountValue ? d.data.percentageGrossAmountValue.toFixed(3).toString() +"%" : ''} ${d.data.name}`;
          const textWidth = getTextWidth(text, "12px Arial");

          if (textWidth > parentWidth / 6) {
            const words = text.split(" ");
            let line = "";
            let lineNumber = 0;
            const lineHeight = 15; // Adjust the line height as needed

            words.forEach((word) => {
              const testLine = line + word + " ";
              const testWidth = getTextWidth(testLine, "12px Arial");
              if (testWidth > parentWidth / 6) {
                legendSvg
                  .append("text")
                  .attr("x", x + 30)
                  .attr("y", y + lineNumber * lineHeight + 12)
                  .style("font-size", "12px")
                  .style("font-family", "Arial")
                  .attr("width", "100%")
                  .text(line);
                line = word + " ";
                lineNumber++;
              } else {
                line = testLine;
              }
            });

            legendSvg
              .append("text")
              .attr("x", x + 30)
              .attr("y", y + lineNumber * lineHeight + 12)
              .style("font-size", "12px")
              .style("font-family", "Arial")
              .attr("width", "100%")
              .text(line);
          } else {
            legendSvg
              .append("text")
              .attr("x", x + 30)
              .attr("y", y + 15)
              .style("font-size", "12px")
              .style("font-family", "Arial")
              .attr("width", "100%")
              .text(text);
          }

          legendSvg
            .append("rect")
            .attr("x", x)
            .attr("y", y)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", colorMap[d.data.id])
        });
      }

    svg.on("click", (event) => zoom(event, root));
    let focus = root;
    let view;
    zoomTo([focus.x, focus.y, focus.r * 2]);

    function zoomTo(v) {
      const k = width / 1.3 / v[2]; //TODO: remove /1.3

      view = v;

      label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      node.attr("r", d => d.r * k);
      // node.attr("r", d => 0.7 * d.r * k); // Multiply the radius by 0.7
    }

    function zoom(event, d) {
      const focus0 = focus;

      focus = d;

      const transition = svg.transition()
          .duration(event.altKey ? 7500 : 750)
          .tween("zoom", d => {
            const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
            return t => zoomTo(i(t));
          });

      label
        .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
        .transition(transition)
          .style("fill-opacity", d => d.parent === focus ? 1 : 0)
          .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
          .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });

      updateLegend(focus);

      if (!focus.parent) {
        //NOTE: reset selected eclass when zoomed out
        // setSelectedEclass(null);
        // setSelectedEclassName(null);
        // setSelectedParentsClasses([]);
      }
    }

  }, []); // This empty dependency array ensures that this code only runs once on component mount

  useEffect(() => {
    //NOTE: programamtically click on graph so that legend becomes visible on first load
    if (divRef?.current) {
      divRef.current.children[0].dispatchEvent(new Event('click'));
    }

  }, [divRef.current]);

  return (
    <div>
      <Modal isOpen={isDownloading} onOpenChange={onOpenChange} isDismissable={false} hideCloseButton={true}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalBody>
                <div className='flex flex-col items-center mx-auto my-auto px-10 py-10'>

                  <Progress
                    label="Wird abgerufen..."
                    size="md"
                    value={downloadProgress.toFixed(2)}
                    color="success"
                    showValueLabel={true}
                    className="max-w-md"
                  />

                  <p className="text-center text-sm font-bold italic mt-4 text-red-500">
                    Bitte halten Sie diese Seite geöffnet!
                  </p>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      <div className='
        flex flex-row
        justify-center
        items-center
        gap-2
        w-full
        px-4
      '
      
      ref={divRef}>
        <svg ref={svgRef}></svg>
      </div>

      <div className=''>
          {selectedEclass !== null && (
            <div className='text-lg font-bold'>
              Ausgewählte Kategorie: {selectedEclassName}
            </div>
          )}
          {selectedEclass !== null && (
            <div>
              <button className="
                rounded-md 
                transition-all duration-500
                bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-indigo-500 hover:to-blue-500
                px-4 py-2 mt-2 mb-4
                font-semibold 
                text-white 
                text-sm
                shadow-sm 
                focus-visible:outline 
                focus-visible:outline-2 
                focus-visible:outline-offset-2"

                onClick={() => {
                  alert("Simulated Download")
                }}
              
                // onClick={async () => {
                //   // download excel file from S3 with the focused class in the svg

                //   const projectId = pathname.split("/")[2];

                //   // console.log(selectedParentsClasses)

                //   //remove null values
                //   const selectedParentsClassesFiltered = selectedParentsClasses.filter((item) => item !== undefined && item !== null && item !== "ECLASS");
                //   // console.log(selectedParentsClassesFiltered)
                //   const lvl = selectedParentsClassesFiltered.length;
                //   // console.log(lvl)

                //   //join with _ and make float first
                //   const key = `projects/${projectId}/eclass/${selectedParentsClassesFiltered.join("_")}_${lvl}.xlsx`;

                //   // console.log(selectedEclass, selectedEclassName)
                //   // console.log("key: ", key)

                //   setIsDownloading(true);
                    
                //   await new Promise(resolve => setTimeout(resolve, 4000));
                
                //   setIsDownloading(false);

                // }}

              >
                  Ausgewählte Eclass herunterladen
              </button>

              <button
                onClick={
                  () => {
                    setSelectedEclass(null);
                    setSelectedEclassName(null);
                    setSelectedParentsClasses([]);

                    if (divRef?.current) {
                      divRef.current.children[0].dispatchEvent(new Event('click'));
                    }
                  }
                }
                className="
                  rounded-md 
                  bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-pink-500 hover:to-pink-500
                  px-4 py-2 mt-4 ml-2
                  text-white 
                  text-sm
                  shadow-sm 
                  inline-block"
              >
                Zurücksetzen <RxReset className='ml-2 inline-block'/>
              </button>
            </div>
          )}
          <svg className='min-h-[400px] w-[100%]' ref={legendRef}></svg>
        </div>

    </div>
  );
}

export default BubbleChart;

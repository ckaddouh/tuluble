import { jsPDF } from "jspdf";

// $(document).ready(function () {
//     $('.modal').modal();
// })

function printing() {

    console.log("PRINTING ATTEMPT")

    // Create a new jsPDF instance
    var doc = new jsPDF();
  
    // Define the table columns and rows
    var columns = ["Name", "Country", "Population"];
    var rows = [  ["China", "Asia", "1,439,323,776"],
      ["India", "Asia", "1,380,004,385"],
      ["United States", "North America", "331,002,651"],
      ["Indonesia", "Asia", "273,523,615"],
      ["Pakistan", "Asia", "220,892,340"]
    ];
  
    // Call the autoTable function to generate the table
    doc.autoTable(columns, rows);
  
    // Save the PDF
    doc.save("table.pdf");
  
  }
  
module.exports = printing();
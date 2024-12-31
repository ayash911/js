(function () {
  let betTotal = 0;

  function game(balance, user) {
    console.log("Game started with balance:", balance, "and user:", user);
    let isLoggedIn = true;
    if (isLoggedIn) {
      console.log("User is logged in.");

      // Get balance from the server
      function getBalance(user) {
        console.log("Fetching balance for user:", user);
        return fetch("/get-balance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: user }),
        })
          .then((response) => {
            console.log("Response status:", response.status);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            console.log("Fetched balance:", data.balance);
            return data.balance; // Return the balance
          })
          .catch((err) => {
            console.error("Fetch error:", err.message);
            alert("Error fetching balance: " + err.message);
            return 0; // Default to 0 in case of an error
          });
      }

      // Create Logout Button
      const logoutButton = document.createElement("button");
      logoutButton.className = "tbs";
      logoutButton.id = "logout";
      logoutButton.textContent = "Logout";
      logoutButton.onclick = function () {
        console.log("Logout button clicked.");
        alert("Logging out...");
        location.reload();
      };

      // Create Topup Button
      const topupButton = document.createElement("button");
      topupButton.className = "tbs";
      topupButton.id = "topup";
      topupButton.textContent = "Topup";
      topupButton.onclick = async function () {
        console.log("Topup button clicked. Fetching balance...");
        const fetchedAmount = await getBalance(user);
        console.log("Fetched amount for Topup:", fetchedAmount);

        if (fetchedAmount <= 10) {
          console.log("Balance is low. Initiating balance update...");
          await updateBalance(1, 1000);
          console.log("Balance updated successfully. Reloading page...");
          location.reload();
        } else {
          console.log("Sufficient balance:", fetchedAmount);
          alert("Balance is sufficient:", fetchedAmount);
        }
      };

      // Append Buttons to Header
      const header = document.getElementById("header-container");
      const title = document.getElementById("game-title");
      console.log("Appending buttons to header.");
      header.insertBefore(logoutButton, title);
      header.appendChild(topupButton);
    } else {
      console.log("User is not logged in. Hiding title.");
      document.getElementById("header-container").style.display = "none";
    }

    // Function to update balance
    function updateBalance(isAdd, amt) {
      console.log("updateBalance called with isAdd:", isAdd, "amt:", amt);
      const username = user;

      if (typeof amt !== "number" || amt <= 0) {
        console.log("Invalid amount detected:", amt);
        alert("Invalid amount. Please enter a positive number.");
        return;
      }

      return fetch("/update-balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          amount: amt,
          isAdd: isAdd,
        }),
      })
        .then((response) => {
          console.log("Update balance response status:", response.status);
          if (response.ok) {
            return response.json();
          } else {
            console.log("Error in update balance response.");
            return response.json().then((data) => {
              throw new Error(data.message);
            });
          }
        })
        .then((data) => {
          console.log("Server response:", data.message);
          alert("Balance updated successfully!");
        })
        .catch((error) => {
          console.error("Error updating balance:", error.message);
          alert(`Failed to update balance: ${error.message}`);
        });
    }

    function saveSpin(winningSpin) {
      console.log("Saving spin with winning number:", winningSpin);
      fetch("/save-spin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ winningNumber: winningSpin }),
      })
        .then((response) => {
          console.log("Save spin response status:", response.status);
          if (!response.ok) {
            return response.text().then((text) => {
              throw new Error(text);
            });
          }
          console.log("Spin saved successfully.");
        })
        .catch((error) => console.error("Error saving spin:", error));
    }

    function loadSpinHistory() {
      console.log("Loading spin history...");
      fetch("/spin-history")
        .then((response) => {
          console.log("Load spin history response status:", response.status);
          if (!response.ok) {
            return response.text().then((text) => {
              throw new Error(text);
            });
          }
          return response.json();
        })
        .then((data) => {
          console.log("Spin history data:", data);
          const pnContent = document.getElementById("pnContent");
          pnContent.innerHTML = ""; // Clear existing history
          data.forEach((spin) => {
            const pnClass = numRed.includes(spin.winning_number)
              ? "pnRed"
              : spin.winning_number == 0
              ? "pnGreen"
              : "pnBlack";

            const pnSpan = document.createElement("span");
            pnSpan.setAttribute("class", pnClass);
            pnSpan.innerText = spin.winning_number;
            pnContent.append(pnSpan);
          });
          pnContent.scrollTop = pnContent.scrollHeight; // Scroll to bottom
        })
        .catch((error) => console.error("Error loading spin history:", error));
    }

    // Call loadSpinHistory when the game loads

    let bankValue = balance;
    let currentBet = 0;
    let wager = 5;
    let lastWager = 0;
    let bet = [];
    let numbersBet = [];
    let previousNumbers = [];

    let numRed = [
      1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
    ];
    let wheelnumbersAC = [
      0, 26, 3, 35, 12, 28, 7, 29, 18, 22, 9, 31, 14, 20, 1, 33, 16, 24, 5, 10,
      23, 8, 30, 11, 36, 13, 27, 6, 34, 17, 25, 2, 21, 4, 19, 15, 32,
    ];

    console.log("Building game container.");
    let container = document.createElement("div");
    container.setAttribute("id", "container");
    document.body.append(container);
    startGame();

    let wheel = document.getElementsByClassName("wheel")[0];
    let ballTrack = document.getElementsByClassName("ballTrack")[0];

    function resetGame() {
      console.log("Resetting game...");
      bankValue = 0;
      currentBet = 0;
      wager = 5;
      bet = [];
      numbersBet = [];
      previousNumbers = [];
      document.getElementById("betting_board").remove();
      document.getElementById("notification").remove();
      buildBettingBoard();
      loadSpinHistory();
    }

    function startGame() {
      console.log("Starting game...");
      buildWheel();
      buildBettingBoard();
      loadSpinHistory();
    }

    function gameOver() {
      console.log("Game over. User is bankrupt.");
      let notification = document.createElement("div");
      notification.setAttribute("id", "notification");
      let nSpan = document.createElement("span");
      nSpan.setAttribute("class", "nSpan");
      nSpan.innerText = "Bankrupt";
      notification.append(nSpan);

      let nBtn = document.createElement("div");
      nBtn.setAttribute("class", "nBtn");
      nBtn.innerText = "Play again";
      nBtn.onclick = function () {
        console.log("Play again button clicked. Resetting game...");
        resetGame();
      };
      notification.append(nBtn);
      container.prepend(notification);
    }

    function buildWheel() {
      console.log("Building the wheel...");

      let wheel = document.createElement("div");
      wheel.setAttribute("class", "wheel");
      console.log("Created main wheel container.");

      let outerRim = document.createElement("div");
      outerRim.setAttribute("class", "outerRim");
      wheel.append(outerRim);
      console.log("Added outer rim to the wheel.");

      let numbers = [
        0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
        5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
      ];

      console.log("Number sequence for wheel:", numbers);

      for (i = 0; i < numbers.length; i++) {
        let a = i + 1;
        let spanClass = numbers[i] < 10 ? "single" : "double";
        console.log(
          `Creating section ${a} with number ${numbers[i]} (class: ${spanClass})`
        );

        let sect = document.createElement("div");
        sect.setAttribute("id", "sect" + a);
        sect.setAttribute("class", "sect");

        let span = document.createElement("span");
        span.setAttribute("class", spanClass);
        span.innerText = numbers[i];
        sect.append(span);

        let block = document.createElement("div");
        block.setAttribute("class", "block");
        sect.append(block);

        wheel.append(sect);
        console.log(`Added section ${a} to the wheel.`);
      }

      let pocketsRim = document.createElement("div");
      pocketsRim.setAttribute("class", "pocketsRim");
      wheel.append(pocketsRim);
      console.log("Added pockets rim to the wheel.");

      let ballTrack = document.createElement("div");
      ballTrack.setAttribute("class", "ballTrack");
      let ball = document.createElement("div");
      ball.setAttribute("class", "ball");
      ballTrack.append(ball);
      wheel.append(ballTrack);
      console.log("Added ball track and ball to the wheel.");

      let pockets = document.createElement("div");
      pockets.setAttribute("class", "pockets");
      wheel.append(pockets);
      console.log("Added pockets to the wheel.");

      let cone = document.createElement("div");
      cone.setAttribute("class", "cone");
      wheel.append(cone);
      console.log("Added cone to the wheel.");

      let turret = document.createElement("div");
      turret.setAttribute("class", "turret");
      wheel.append(turret);
      console.log("Added turret to the wheel.");

      let turretHandle = document.createElement("div");
      turretHandle.setAttribute("class", "turretHandle");

      let thendOne = document.createElement("div");
      thendOne.setAttribute("class", "thendOne");
      turretHandle.append(thendOne);
      console.log("Added first turret handle end.");

      let thendTwo = document.createElement("div");
      thendTwo.setAttribute("class", "thendTwo");
      turretHandle.append(thendTwo);
      console.log("Added second turret handle end.");

      wheel.append(turretHandle);
      console.log("Added turret handle to the wheel.");

      container.append(wheel);
      console.log("Wheel has been appended to the container.");
    }

    function buildBettingBoard() {
      let bettingBoard = document.createElement("div");
      bettingBoard.setAttribute("id", "betting_board");
      console.log("Created bettingBoard div");

      let wl = document.createElement("div");
      wl.setAttribute("class", "winning_lines");
      console.log("Created wl div for winning lines");

      var wlttb = document.createElement("div");
      wlttb.setAttribute("id", "wlttb_top");
      wlttb.setAttribute("class", "wlttb");
      console.log("Created wlttb div for top betting lines");

      for (i = 0; i < 11; i++) {
        let j = i;
        var ttbbetblock = document.createElement("div");
        ttbbetblock.setAttribute("class", "ttbbetblock");
        console.log("Created ttbbetblock div for top betting block " + i);

        var numA = 1 + 3 * j;
        var numB = 2 + 3 * j;
        var numC = 3 + 3 * j;
        var numD = 4 + 3 * j;
        var numE = 5 + 3 * j;
        var numF = 6 + 3 * j;
        let num =
          numA +
          ", " +
          numB +
          ", " +
          numC +
          ", " +
          numD +
          ", " +
          numE +
          ", " +
          numF;
        console.log("Generated numbers for betting block: " + num);

        var objType = "double_street";

        ttbbetblock.onclick = function () {
          console.log("Betting block clicked. Setting bet with num: " + num);
          setBet(this, num, objType, 5);
        };

        ttbbetblock.oncontextmenu = function (e) {
          e.preventDefault();
          console.log(
            "Betting block right-clicked. Removing bet with num: " + num
          );
          removeBet(this, num, objType, 5);
        };

        wlttb.append(ttbbetblock);
      }

      wl.append(wlttb);
      console.log("Appended wlttb to wl");

      for (c = 1; c < 4; c++) {
        let d = c;
        var wlttb = document.createElement("div");
        wlttb.setAttribute("id", "wlttb_" + c);
        wlttb.setAttribute("class", "wlttb");
        console.log("Created wlttb div for betting lines " + c);

        for (i = 0; i < 12; i++) {
          let j = i;
          var ttbbetblock = document.createElement("div");
          ttbbetblock.setAttribute("class", "ttbbetblock");
          console.log("Created ttbbetblock div for line " + i);

          ttbbetblock.onclick = function () {
            let num, objType, odd;
            if (d == 1 || d == 2) {
              var numA = 2 - (d - 1) + 3 * j;
              var numB = 3 - (d - 1) + 3 * j;
              num = numA + ", " + numB;
              objType = "split";
              odd = 17;
            } else {
              var numA = 1 + 3 * j;
              var numB = 2 + 3 * j;
              var numC = 3 + 3 * j;
              num = numA + ", " + numB + ", " + numC;
              objType = "street";
              odd = 11;
            }
            console.log("Betting block clicked. Setting bet with num: " + num);
            setBet(this, num, objType, odd);
          };

          ttbbetblock.oncontextmenu = function (e) {
            e.preventDefault();
            let num, objType, odd;
            if (d == 1 || d == 2) {
              var numA = 2 - (d - 1) + 3 * j;
              var numB = 3 - (d - 1) + 3 * j;
              num = numA + ", " + numB;
              objType = "split";
              odd = 17;
            } else {
              var numA = 1 + 3 * j;
              var numB = 2 + 3 * j;
              var numC = 3 + 3 * j;
              num = numA + ", " + numB + ", " + numC;
              objType = "street";
              odd = 11;
            }
            console.log(
              "Betting block right-clicked. Removing bet with num: " + num
            );
            removeBet(this, num, objType, odd);
          };

          wlttb.append(ttbbetblock);
        }

        wl.append(wlttb);
        console.log("Appended wlttb_" + c + " to wl");
      }

      for (c = 1; c < 12; c++) {
        let d = c;
        var wlrtl = document.createElement("div");
        wlrtl.setAttribute("id", "wlrtl_" + c);
        wlrtl.setAttribute("class", "wlrtl");
        console.log("Created wlrtl div for rtl block " + c);

        for (i = 1; i < 4; i++) {
          let j = i;
          var rtlbb = document.createElement("div");
          rtlbb.setAttribute("class", "rtlbb" + i);
          console.log("Created rtlbb div for rtl block " + i);

          var numA = 3 + 3 * (d - 1) - (j - 1);
          var numB = 6 + 3 * (d - 1) - (j - 1);
          let num = numA + ", " + numB;

          rtlbb.onclick = function () {
            console.log("Betting block clicked. Setting bet with num: " + num);
            setBet(this, num, "split", 17);
          };

          rtlbb.oncontextmenu = function (e) {
            e.preventDefault();
            console.log(
              "Betting block right-clicked. Removing bet with num: " + num
            );
            removeBet(this, num, "split", 17);
          };

          wlrtl.append(rtlbb);
        }

        wl.append(wlrtl);
        console.log("Appended wlrtl_" + c + " to wl");
      }

      for (c = 1; c < 3; c++) {
        var wlcb = document.createElement("div");
        wlcb.setAttribute("id", "wlcb_" + c);
        wlcb.setAttribute("class", "wlcb");
        console.log("Created wlcb div for corner bet " + c);

        for (i = 1; i < 12; i++) {
          let count = c == 1 ? i : i + 11;
          var cbbb = document.createElement("div");
          cbbb.setAttribute("id", "cbbb_" + count);
          cbbb.setAttribute("class", "cbbb");
          console.log("Created cbbb div for corner bet " + count);

          var numA = "2";
          var numB = "3";
          var numC = "5";
          var numD = "6";
          let num =
            count >= 1 && count < 12
              ? parseInt(numA) +
                (count - 1) * 3 +
                ", " +
                (parseInt(numB) + (count - 1) * 3) +
                ", " +
                (parseInt(numC) + (count - 1) * 3) +
                ", " +
                (parseInt(numD) + (count - 1) * 3)
              : parseInt(numA) -
                1 +
                (count - 12) * 3 +
                ", " +
                (parseInt(numB) - 1 + (count - 12) * 3) +
                ", " +
                (parseInt(numC) - 1 + (count - 12) * 3) +
                ", " +
                (parseInt(numD) - 1 + (count - 12) * 3);

          var objType = "corner_bet";

          cbbb.onclick = function () {
            console.log("Betting block clicked. Setting bet with num: " + num);
            setBet(this, num, objType, 8);
          };

          cbbb.oncontextmenu = function (e) {
            e.preventDefault();
            console.log(
              "Betting block right-clicked. Removing bet with num: " + num
            );
            removeBet(this, num, objType, 8);
          };

          wlcb.append(cbbb);
        }

        wl.append(wlcb);
        console.log("Appended wlcb_" + c + " to wl");
      }

      bettingBoard.append(wl);
      console.log("Appended wl to bettingBoard");

      let bbtop = document.createElement("div");
      bbtop.setAttribute("class", "bbtop");
      console.log("Created bbtop div.");
      let bbtopBlocks = ["1 to 18", "19 to 36"];
      for (i = 0; i < bbtopBlocks.length; i++) {
        let f = i;
        var bbtoptwo = document.createElement("div");
        bbtoptwo.setAttribute("class", "bbtoptwo");
        console.log(`Created bbtoptwo block: ${bbtopBlocks[i]}`);

        let num =
          f == 0
            ? "1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18"
            : "19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36";
        var objType = f == 0 ? "outside_low" : "outside_high";
        bbtoptwo.onclick = function () {
          console.log(`Setting bet on ${bbtopBlocks[i]}: ${num}`);
          setBet(this, num, objType, 1);
        };
        bbtoptwo.oncontextmenu = function (e) {
          e.preventDefault();
          console.log(`Removing bet from ${bbtopBlocks[i]}: ${num}`);
          removeBet(this, num, objType, 1);
        };
        bbtoptwo.innerText = bbtopBlocks[i];
        bbtop.append(bbtoptwo);
      }
      bettingBoard.append(bbtop);

      let numberBoard = document.createElement("div");
      numberBoard.setAttribute("class", "number_board");
      console.log("Created number board.");

      let zero = document.createElement("div");
      zero.setAttribute("class", "number_0");
      console.log("Created number 0 block.");
      var objType = "zero";
      var odds = 35;
      zero.onclick = function () {
        console.log("Setting bet on number 0.");
        setBet(this, "0", objType, odds);
      };
      zero.oncontextmenu = function (e) {
        e.preventDefault();
        console.log("Removing bet from number 0.");
        removeBet(this, "0", objType, odds);
      };
      let nbnz = document.createElement("div");
      nbnz.setAttribute("class", "nbn");
      nbnz.innerText = "0";
      zero.append(nbnz);
      numberBoard.append(zero);

      var numberBlocks = [
        3,
        6,
        9,
        12,
        15,
        18,
        21,
        24,
        27,
        30,
        33,
        36,
        "2 to 1",
        2,
        5,
        8,
        11,
        14,
        17,
        20,
        23,
        26,
        29,
        32,
        35,
        "2 to 1",
        1,
        4,
        7,
        10,
        13,
        16,
        19,
        22,
        25,
        28,
        31,
        34,
        "2 to 1",
      ];
      var redBlocks = [
        1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
      ];
      for (i = 0; i < numberBlocks.length; i++) {
        let a = i;
        var nbClass =
          numberBlocks[i] == "2 to 1" ? "tt1_block" : "number_block";
        var colourClass = redBlocks.includes(numberBlocks[i])
          ? " redNum"
          : nbClass == "number_block"
          ? " blackNum"
          : "";
        var numberBlock = document.createElement("div");
        numberBlock.setAttribute("class", nbClass + colourClass);
        console.log(`Created number block: ${numberBlocks[i]}`);

        numberBlock.onclick = function () {
          if (numberBlocks[a] != "2 to 1") {
            console.log(`Setting bet on number: ${numberBlocks[a]}`);
            setBet(this, "" + numberBlocks[a] + "", "inside_whole", 35);
          } else {
            num =
              a == 12
                ? "3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36"
                : a == 25
                ? "2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35"
                : "1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34";
            console.log(`Setting bet on column: ${num}`);
            setBet(this, num, "outside_column", 2);
          }
        };
        numberBlock.oncontextmenu = function (e) {
          e.preventDefault();
          if (numberBlocks[a] != "2 to 1") {
            console.log(`Removing bet from number: ${numberBlocks[a]}`);
            removeBet(this, "" + numberBlocks[a] + "", "inside_whole", 35);
          } else {
            num =
              a == 12
                ? "3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36"
                : a == 25
                ? "2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35"
                : "1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34";
            console.log(`Removing bet from column: ${num}`);
            removeBet(this, num, "outside_column", 2);
          }
        };

        var nbn = document.createElement("div");
        nbn.setAttribute("class", "nbn");
        nbn.innerText = numberBlocks[i];
        numberBlock.append(nbn);
        numberBoard.append(numberBlock);
      }
      bettingBoard.append(numberBoard);

      let bo3Board = document.createElement("div");
      bo3Board.setAttribute("class", "bo3_board");
      let bo3Blocks = ["1 to 12", "13 to 24", "25 to 36"];
      for (i = 0; i < bo3Blocks.length; i++) {
        let b = i;
        var bo3Block = document.createElement("div");
        bo3Block.setAttribute("class", "bo3_block");
        console.log(`Created bo3 block: ${bo3Blocks[i]}`);
        bo3Block.onclick = function () {
          num =
            b == 0
              ? "1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12"
              : b == 1
              ? "13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24"
              : "25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36";
          console.log(`Setting bet on bo3: ${bo3Blocks[b]}`);
          setBet(this, num, "outside_dozen", 2);
        };
        bo3Block.oncontextmenu = function (e) {
          e.preventDefault();
          num =
            b == 0
              ? "1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12"
              : b == 1
              ? "13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24"
              : "25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36";
          console.log(`Removing bet from bo3: ${bo3Blocks[b]}`);
          removeBet(this, num, "outside_dozen", 2);
        };
        bo3Block.innerText = bo3Blocks[i];
        bo3Board.append(bo3Block);
      }
      bettingBoard.append(bo3Board);

      let otoBoard = document.createElement("div");
      otoBoard.setAttribute("class", "oto_board");
      let otoBlocks = ["EVEN", "RED", "BLACK", "ODD"];
      for (i = 0; i < otoBlocks.length; i++) {
        let d = i;
        var colourClass =
          otoBlocks[i] == "RED"
            ? " redNum"
            : otoBlocks[i] == "BLACK"
            ? " blackNum"
            : "";
        var otoBlock = document.createElement("div");
        otoBlock.setAttribute("class", "oto_block" + colourClass);
        console.log(`Created oto block: ${otoBlocks[i]}`);
        otoBlock.onclick = function () {
          num =
            d == 0
              ? "2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36"
              : d == 1
              ? "1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36"
              : d == 2
              ? "2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35"
              : "1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35";
          console.log(`Setting bet on oto: ${otoBlocks[d]}`);
          setBet(this, num, "outside_oerb", 1);
        };
        otoBlock.oncontextmenu = function (e) {
          num =
            d == 0
              ? "2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36"
              : d == 1
              ? "1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36"
              : d == 2
              ? "2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35"
              : "1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35";
          e.preventDefault();
          console.log(`Removing bet from oto: ${otoBlocks[d]}`);
          removeBet(this, num, "outside_oerb", 1);
        };
        otoBlock.innerText = otoBlocks[i];
        otoBoard.append(otoBlock);
      }
      bettingBoard.append(otoBoard);

      let chipDeck = document.createElement("div");
      chipDeck.setAttribute("class", "chipDeck");
      let chipValues = [1, 5, 10, 100, "clear"];
      for (i = 0; i < chipValues.length; i++) {
        let cvi = i;
        let chipColour =
          i == 0
            ? "red"
            : i == 1
            ? "blue cdChipActive"
            : i == 2
            ? "orange"
            : i == 3
            ? "gold"
            : "clearBet";
        let chip = document.createElement("div");
        chip.setAttribute("class", "cdChip " + chipColour);
        chip.onclick = function () {
          if (cvi !== 4) {
            console.log(`Selecting chip value: ${chipValues[cvi]}`);
            let cdChipActive = document.getElementsByClassName("cdChipActive");
            for (i = 0; i < cdChipActive.length; i++) {
              cdChipActive[i].classList.remove("cdChipActive");
            }
            let curClass = this.getAttribute("class");
            if (!curClass.includes("cdChipActive")) {
              this.setAttribute("class", curClass + " cdChipActive");
            }
            wager = parseInt(chip.childNodes[0].innerText);
          } else {
            console.log("Clearing bet.");
            bankValue = bankValue + currentBet;
            currentBet = 0;
            document.getElementById("bankSpan").innerText =
              "" + bankValue.toLocaleString("en-GB") + "";
            document.getElementById("betSpan").innerText =
              "" + currentBet.toLocaleString("en-GB") + "";
            clearBet();
            removeChips();
          }
        };
        let chipSpan = document.createElement("span");
        chipSpan.setAttribute("class", "cdChipSpan");
        chipSpan.innerText = chipValues[i];
        chip.append(chipSpan);
        chipDeck.append(chip);
      }
      bettingBoard.append(chipDeck);

      let bankContainer = document.createElement("div");
      bankContainer.setAttribute("class", "bankContainer");

      let bank = document.createElement("div");
      bank.setAttribute("class", "bank");
      let bankSpan = document.createElement("span");
      bankSpan.setAttribute("id", "bankSpan");
      bankSpan.innerText = "" + bankValue.toLocaleString("en-GB") + "";
      bank.append(bankSpan);
      bankContainer.append(bank);

      let bet = document.createElement("div");
      bet.setAttribute("class", "bet");
      let betSpan = document.createElement("span");
      betSpan.setAttribute("id", "betSpan");
      betSpan.innerText = "" + currentBet.toLocaleString("en-GB") + "";
      bet.append(betSpan);
      bankContainer.append(bet);
      bettingBoard.append(bankContainer);

      let pnBlock = document.createElement("div");
      pnBlock.setAttribute("class", "pnBlock");
      let pnContent = document.createElement("div");
      pnContent.setAttribute("id", "pnContent");
      pnContent.onwheel = function (e) {
        e.preventDefault();
        pnContent.scrollLeft += e.deltaY;
      };
      pnBlock.append(pnContent);
      bettingBoard.append(pnBlock);

      container.append(bettingBoard);
      console.log("App setup complete.");
    }

    function clearBet() {
      console.log("Clearing bet...");
      bet = [];
      numbersBet = [];
    }

    function setBet(e, n, t, o) {
      console.log(
        `Setting bet: wager = ${wager}, bet type = ${t}, numbers = ${n}`
      );
      lastWager = wager;
      wager = bankValue < wager ? bankValue : wager;
      if (wager > 0) {
        if (!container.querySelector(".spinBtn")) {
          console.log("Creating spin button...");
          let spinBtn = document.createElement("div");
          spinBtn.setAttribute("class", "spinBtn");
          spinBtn.innerText = "spin";
          spinBtn.onclick = function () {
            console.log("Spin button clicked, spinning...");
            this.remove();
            spin();
          };
          container.append(spinBtn);
        }
        bankValue = bankValue - wager;
        currentBet = currentBet + wager;
        console.log(
          `Updated bank value: ${bankValue}, current bet: ${currentBet}`
        );

        document.getElementById("bankSpan").innerText =
          "" + bankValue.toLocaleString("en-GB") + "";
        document.getElementById("betSpan").innerText =
          "" + currentBet.toLocaleString("en-GB") + "";

        for (i = 0; i < bet.length; i++) {
          if (bet[i].numbers == n && bet[i].type == t) {
            console.log(`Updating bet for numbers: ${n}, type: ${t}`);
            bet[i].amt = bet[i].amt + wager;
            let chipColour =
              bet[i].amt < 5
                ? "red"
                : bet[i].amt < 10
                ? "blue"
                : bet[i].amt < 100
                ? "orange"
                : "gold";
            e.querySelector(".chip").style.cssText = "";
            e.querySelector(".chip").setAttribute(
              "class",
              "chip " + chipColour
            );
            let chipSpan = e.querySelector(".chipSpan");
            chipSpan.innerText = bet[i].amt;
            return;
          }
        }

        var obj = {
          amt: wager,
          type: t,
          odds: o,
          numbers: n,
        };
        bet.push(obj);

        let numArray = n.split(",").map(Number);
        for (i = 0; i < numArray.length; i++) {
          if (!numbersBet.includes(numArray[i])) {
            numbersBet.push(numArray[i]);
          }
        }

        if (!e.querySelector(".chip")) {
          console.log("Creating new chip for bet...");
          let chipColour =
            wager < 5
              ? "red"
              : wager < 10
              ? "blue"
              : wager < 100
              ? "orange"
              : "gold";
          let chip = document.createElement("div");
          chip.setAttribute("class", "chip " + chipColour);
          let chipSpan = document.createElement("span");
          chipSpan.setAttribute("class", "chipSpan");
          chipSpan.innerText = wager;
          chip.append(chipSpan);
          e.append(chip);
        }
      }
    }

    function spin() {
      console.log("Spinning the wheel...");
      var winningSpin = Math.floor(Math.random() * 37);
      let winValue = 0;

      var container = document.querySelector("#container");
      container.style.cursor = "not-allowed";
      container.style.pointerEvents = "none";

      saveSpin(winningSpin);

      spinWheel(winningSpin);

      setTimeout(function () {
        console.log(`Winning spin: ${winningSpin}`);
        if (numbersBet.includes(winningSpin)) {
          for (let i = 0; i < bet.length; i++) {
            var numArray = bet[i].numbers.split(",").map(Number);
            if (numArray.includes(winningSpin)) {
              console.log(`Bet on ${winningSpin} wins. Adding winnings...`);
              bankValue = bankValue + bet[i].odds * bet[i].amt + bet[i].amt;
              winValue = winValue + bet[i].odds * bet[i].amt;
              betTotal = betTotal + bet[i].amt;
            }
          }
        } else {
          betTotal = bet.reduce((total, b) => total + b.amt, 0);
        }

        win(winningSpin, winValue, betTotal);

        currentBet = 0;
        console.log(
          `Current bank value: ${bankValue}, current bet: ${currentBet}`
        );
        document.getElementById("bankSpan").innerText =
          "" + bankValue.toLocaleString("en-GB") + "";
        document.getElementById("betSpan").innerText =
          "" + currentBet.toLocaleString("en-GB") + "";

        let pnClass = numRed.includes(winningSpin)
          ? "pnRed"
          : winningSpin == 0
          ? "pnGreen"
          : "pnBlack";
        let pnContent = document.getElementById("pnContent");
        let pnSpan = document.createElement("span");
        pnSpan.setAttribute("class", pnClass);
        pnSpan.innerText = winningSpin;
        pnContent.prepend(pnSpan);
        pnContent.scrollright = pnContent.scrollWidth;

        bet = [];
        numbersBet = [];
        removeChips();

        container.style.cursor = "default";
        container.style.pointerEvents = "auto";
        wager = lastWager;
        if (bankValue == 0 && currentBet == 0) {
          console.log("Game over. No more bets or bank balance.");
          gameOver();
        }
      }, 10000);
    }

    function win(winningSpin, winValue, betTotal) {
      console.log(
        `Win function triggered: winningSpin = ${winningSpin}, winValue = ${winValue}, betTotal = ${betTotal}`
      );
      let notification = document.createElement("div");
      notification.setAttribute("id", "notification");
      let nSpan = document.createElement("div");
      nSpan.setAttribute("class", "nSpan");

      if (winValue > 0) {
        console.log("Player wins!");
        updateBalance(1, winValue);
        let nsnumber = document.createElement("span");
        nsnumber.setAttribute("class", "nsnumber");
        nsnumber.style.cssText = numRed.includes(winningSpin)
          ? "color:red"
          : "color:black";
        nsnumber.innerText = winningSpin;
        nSpan.append(nsnumber);
        let nsTxt = document.createElement("span");
        nsTxt.innerText = " Win";
        nSpan.append(nsTxt);
        let nsWin = document.createElement("div");
        nsWin.setAttribute("class", "nsWin");
        let nsWinBlock = document.createElement("div");
        nsWinBlock.setAttribute("class", "nsWinBlock");
        nsWinBlock.innerText = "Bet: " + betTotal;
        nSpan.append(nsWinBlock);
        nsWin.append(nsWinBlock);
        nsWinBlock = document.createElement("div");
        nsWinBlock.setAttribute("class", "nsWinBlock");
        nsWinBlock.innerText = "Win: " + winValue;
        nSpan.append(nsWinBlock);
        nsWin.append(nsWinBlock);
        nsWinBlock = document.createElement("div");
        nsWinBlock.setAttribute("class", "nsWinBlock");
        nsWinBlock.innerText = "Payout: " + (winValue + betTotal);
        nsWin.append(nsWinBlock);
        nSpan.append(nsWin);
      } else {
        console.log("Player loses.");
        updateBalance(0, betTotal);
        let nsnumber = document.createElement("span");
        nsnumber.setAttribute("class", "nsnumber");
        nsnumber.style.cssText = "color:black";
        nsnumber.innerText = winningSpin;
        nSpan.append(nsnumber);
        let nsTxt = document.createElement("span");
        nsTxt.innerText = " Lose";
        nSpan.append(nsTxt);
        let nsLost = document.createElement("div");
        nsLost.setAttribute("class", "nsLost");
        let nsLostBlock = document.createElement("div");
        nsLostBlock.setAttribute("class", "nsLostBlock");
        nsLostBlock.innerText = "Bet: " + betTotal;
        nsLost.append(nsLostBlock);
        nsLostBlock = document.createElement("div");
        nsLostBlock.setAttribute("class", "nsLostBlock");
        nsLostBlock.innerText = "Lost: " + betTotal;
        nsLost.append(nsLostBlock);
        nSpan.append(nsLost);
      }

      notification.append(nSpan);
      container.prepend(notification);
      setTimeout(function () {
        console.log("Notification fading out...");
        notification.style.cssText = "opacity:0";
      }, 3000);
      setTimeout(function () {
        console.log("Notification removed.");
        notification.remove();
      }, 4000);
    }

    function removeBet(e, n, t, o) {
      console.log(`Removing bet: numbers = ${n}, type = ${t}`);
      wager = wager == 0 ? 100 : wager;
      for (i = 0; i < bet.length; i++) {
        if (bet[i].numbers == n && bet[i].type == t) {
          if (bet[i].amt != 0) {
            console.log(`Removing wager of amount ${wager} from bet.`);
            wager = bet[i].amt > wager ? wager : bet[i].amt;
            bet[i].amt = bet[i].amt - wager;
            bankValue = bankValue + wager;
            currentBet = currentBet - wager;
            document.getElementById("bankSpan").innerText =
              "" + bankValue.toLocaleString("en-GB") + "";
            document.getElementById("betSpan").innerText =
              "" + currentBet.toLocaleString("en-GB") + "";
            if (bet[i].amt == 0) {
              console.log("Bet amount is zero, hiding chip.");
              e.querySelector(".chip").style.cssText = "display:none";
            } else {
              let chipColour =
                bet[i].amt < 5
                  ? "red"
                  : bet[i].amt < 10
                  ? "blue"
                  : bet[i].amt < 100
                  ? "orange"
                  : "gold";
              console.log(`Updating chip colour to: ${chipColour}`);
              e.querySelector(".chip").setAttribute(
                "class",
                "chip " + chipColour
              );
              let chipSpan = e.querySelector(".chipSpan");
              chipSpan.innerText = bet[i].amt;
            }
          }
        }
      }

      if (currentBet == 0 && container.querySelector(".spinBtn")) {
        console.log("Removing spin button, no current bet.");
        document.getElementsByClassName("spinBtn")[0].remove();
      }
    }

    function spinWheel(winningSpin) {
      console.log(`Spinning the wheel: winningSpin = ${winningSpin}`);
      for (i = 0; i < wheelnumbersAC.length; i++) {
        if (wheelnumbersAC[i] == winningSpin) {
          var degree = i * 9.73 + 362;
        }
      }
      wheel.style.cssText = "animation: wheelRotate 5s linear infinite;";
      ballTrack.style.cssText = "animation: ballRotate 1s linear infinite;";

      setTimeout(function () {
        console.log("Ball rotation animation applied.");
        ballTrack.style.cssText = "animation: ballRotate 2s linear infinite;";
        style = document.createElement("style");
        style.type = "text/css";
        style.innerText =
          "@keyframes ballStop {from {transform: rotate(0deg);}to{transform: rotate(-" +
          degree +
          "deg);}}";
        document.head.appendChild(style);
      }, 2000);
      setTimeout(function () {
        console.log("Ball stop animation applied.");
        ballTrack.style.cssText = "animation: ballStop 3s linear;";
      }, 6000);
      setTimeout(function () {
        console.log(`Ball final position set to: -${degree}deg`);
        ballTrack.style.cssText = "transform: rotate(-" + degree + "deg);";
      }, 9000);
      setTimeout(function () {
        console.log("Wheel spin animation stopped.");
        wheel.style.cssText = "";
        style.remove();
      }, 10000);
    }

    function removeChips() {
      console.log("Removing all chips...");
      var chips = document.getElementsByClassName("chip");
      if (chips.length > 0) {
        for (i = 0; i < chips.length; i++) {
          console.log("Removing chip...");
          chips[i].remove();
        }
        removeChips();
      }
    }
  }
  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("login-btn").addEventListener("click", login);
    document.getElementById("signup-btn").addEventListener("click", signup);
  });

  // Login function
  function login() {
    console.log("Login function triggered.");
    var username = document.getElementById("username").value.trim();
    var password = document.getElementById("password").value.trim();

    if (!username || !password) {
      alert("Username and password are required.");
      console.log("Username or password is missing.");
      return;
    }

    console.log(`Attempting login with username: ${username}`);

    fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => {
        if (response.ok) {
          console.log("Login successful.");
          return response.json();
        } else {
          console.log("Login failed, processing error.");
          return response.json().then((data) => {
            throw new Error(data.message);
          });
        }
      })
      .then((data) => {
        alert(`${data.message}. Your balance is $${data.balance}`);
        console.log(`User logged in successfully. Balance: $${data.balance}`);
        document.getElementById("login-form").style.display = "none";
        document.getElementById("signup-form").style.display = "none";
        game(data.balance, username); // Proceed to game or next step
      })
      .catch((error) => {
        alert(error.message);
        console.log("Login error:", error);
      });
  }

  // Signup function
  function signup() {
    console.log("Signup function triggered.");
    const newUsername = document.getElementById("new-username").value.trim();
    const newPassword = document.getElementById("new-password").value.trim();

    if (!newUsername || !newPassword) {
      alert("Please fill in both fields");
      console.log("Username or password is missing in signup.");
      return;
    }

    console.log(`Attempting signup with username: ${newUsername}`);

    fetch("/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: newUsername, password: newPassword }),
    })
      .then((response) => {
        if (response.ok) {
          console.log("Signup successful.");
          alert("Signup successful. You can now log in.");
          showLoginForm(); // Show the login form after successful signup
        } else {
          console.log("Signup failed, processing error.");
          return response.text().then((text) => {
            throw new Error(text);
          });
        }
      })
      .catch((error) => {
        if (error.message == "Username already exists") {
          alert("User Already Exists Please Login");
          console.log("Username already exists.");
          showLoginForm();
        }
        console.log("Signup error:", error.message); // Display the error message
      });
  }
})();

// Show Signup form
function showSignupForm() {
  console.log("Switching to signup form.");
  document.getElementById("login-form").style.display = "none";
  document.getElementById("signup-form").style.display = "block";
}

// Show Login form
function showLoginForm() {
  console.log("Switching to login form.");
  document.getElementById("signup-form").style.display = "none";
  document.getElementById("login-form").style.display = "block";
}

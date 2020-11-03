
class KChart {
  constructor (config) {
    this.config = config
    this.makeUILayer()
    this.ctx = this.makeHighRes(config.id)
    const statistics = this.splitData()
    // 基本绘图配置
    const options = {
      chartZone: [50, 50, 1300, 600], // 坐标系的区域
      yAxisLabel: ['2100', '2150', '2200', '2250', '2300', '2350'], // y轴坐标
      xAxisLabel: statistics.categoryData, // x轴坐标
      data: statistics.values
    }
    options.yMax = Number(options.yAxisLabel[options.yAxisLabel.length - 1])
    options.yMin = Number(options.yAxisLabel[0])
    this.options = options

    this.render()
  }

  /**
   * 适应高清屏幕
   */
  makeHighRes (canvas) {
    const ctx = canvas.getContext('2d')
    // Get the device pixel ratio, falling back to 1.
    const dpr = window.devicePixelRatio || window.webkitDevicePixelRatio || window.mozDevicePixelRatio || 1
    // Get the size of the canvas in CSS pixels.
    const oldWidth = canvas.width
    const oldHeight = canvas.height
    // 根据dpr，扩大canvas画布的像素，使1个canvas像素和1个物理像素相等
    // 要设置canvas的画布大小，使用的是 canvas.width 和 canvas.height；
    // 要设置画布的实际渲染大小，使用的 style 属性或CSS设置的 width 和height，只是简单的对画布进行缩放。
    canvas.width = Math.round(oldWidth * dpr)
    canvas.height = Math.round(oldHeight * dpr)
    canvas.style.width = oldWidth + 'px'
    canvas.style.height = oldHeight + 'px'
    // 由于画布扩大，canvas的坐标系也跟着扩大，如果按照原先的坐标系绘图内容会缩小，所以需要将绘制比例放大
    ctx.scale(dpr, dpr)
    return ctx
  }

  /**
   * 判断是否在可视坐标系内部
   */
  isPointIn (x, y) {
    const { chartZone } = this.options
    return x >= chartZone[0] && x <= chartZone[2] && y >= chartZone[1] && y <= chartZone[3]
  }

  // 绘制UI
  drawUI (x, y, flag) {
    this.clearArc()
    if (flag) {
      this.drawMouseBlock(x, y)
    }
    // 判断是否在坐标系内部
    if (!this.isPointIn(x, y)) return
    this.drawRealTimeData(x, y)
  }

  // 创建圆滑块
  drawMouseBlock (x, y) {
    this.uiCtx.beginPath()
    this.uiCtx.fillStyle = 'rgba(193,193,193,0.5)'
    this.uiCtx.arc(x, y, 20, 0, Math.PI * 2)
    this.uiCtx.fill()
  }

  // 绘制实时数据
  drawRealTimeData (x, y) {
    const { chartZone, data } = this.options

    // 绘制十字线
    this.uiCtx.beginPath()
    this.uiCtx.strokeStyle = '#008BE5'
    this.uiCtx.moveTo(x, chartZone[1])
    this.uiCtx.lineTo(x, chartZone[3])
    this.uiCtx.moveTo(chartZone[1], y)
    this.uiCtx.lineTo(chartZone[2], y)
    this.uiCtx.stroke()

    // 绘制实时数据
    this.uiCtx.fillStyle = '#EDF2FD'
    this.uiCtx.fillRect(chartZone[0] - 46, y - 9, 46, 18)
    this.uiCtx.fillRect(x - 27, chartZone[3], 54, 18)
    this.uiCtx.font = 'bold 10px sans-serif'
    this.uiCtx.fillStyle = '#333333'
    this.uiCtx.textAlign = 'right'
    this.uiCtx.fillText(this.transYCoordToYValue(y) || '', chartZone[0] - 3, y + 3) // y轴实时数据
    this.uiCtx.textAlign = 'center'
    const curData = this.transXCoordToXValue(x)
    this.uiCtx.fillText(curData.value || '', x, chartZone[3] + 12) // x轴实时数据

    const item = data[curData.index]
    // 绘制顶部文字
    let xCoord = chartZone[0]
    const height = chartZone[1] - 20
    const color = this.getColor(item)
    this.uiCtx.font = 'bold 14px sans-serif'
    this.uiCtx.fillStyle = '#000000'
    this.uiCtx.textAlign = 'start'
    this.uiCtx.fillText(curData.value, xCoord += 100, height)
    xCoord += 30
    const texts = ['高', '开', '低', '收'];
    [item[3], item[0], item[2], item[1]].forEach((it, index) => {
      this.uiCtx.fillStyle = '#889198'
      this.uiCtx.fillText(texts[index], xCoord += 70, height)
      this.uiCtx.fillStyle = color
      this.uiCtx.fillText(it, xCoord += 20, height)
    })
  }

  clearArc () {
    this.uiCtx.clearRect(0, 0, this.ui.width, this.ui.height)
  }

  /**
   * 设置UI层
   */
  makeUILayer () {
    const { id } = this.config
    const width = id.width
    const height = id.height
    const styles = getComputedStyle(id, null)
    const ui = document.createElement('canvas')
    ui.id = 'ui-layer'
    ui.style.zIndex = Number(styles.zIndex) + 1
    ui.width = width
    ui.height = height
    document.body.insertBefore(ui, id)
    this.ui = ui
    this.uiCtx = this.makeHighRes(ui)

    ui.addEventListener('mousedown', (event) => {
      this.drawUI(event.clientX, event.clientY, true)

      const up = (e) => {
        this.drawUI(e.clientX, e.clientY)
        document.removeEventListener('mousemove', move)
        document.removeEventListener('mouseup', up)
      }
      const move = (e) => {
        this.drawUI(e.clientX, e.clientY, true)
      }

      document.addEventListener('mousemove', move)
      document.addEventListener('mouseup', up)
    })
  }

  /**
   * 处理数据
   */
  splitData () {
    const categoryData = []
    const values = []
    this.config.data.forEach((item) => {
      categoryData.push(item[0])
      values.push(item.slice(1))
    })
    return { categoryData, values }
  }

  /**
   * 绘制坐标轴
   */
  drawAxis () {
    const { chartZone } = this.options
    this.ctx.strokeWidth = 4
    this.ctx.strokeStyle = '#353535'
    this.ctx.moveTo(chartZone[0], chartZone[1])
    this.ctx.lineTo(chartZone[0], chartZone[3]) // 画y轴
    this.ctx.lineTo(chartZone[2], chartZone[3]) // 画x轴
    this.ctx.stroke()
  }

  /**
   * 绘制y轴坐标
   */
  drawYLabels () {
    const { chartZone, yAxisLabel } = this.options
    const labels = yAxisLabel
    const yLength = chartZone[3] - chartZone[1]
    const gap = yLength / (labels.length - 1) // 坐标点之间的间隔

    labels.forEach((label, index) => {
      // 绘制坐标文字
      const height = chartZone[3] - index * gap
      this.ctx.textAlign = 'right'
      this.ctx.fillText(label, chartZone[0] - 14, height + 3)
      // 绘制小间隔
      this.ctx.beginPath()
      this.ctx.strokeStyle = '#353535'
      this.ctx.moveTo(chartZone[0] - 10, height)
      this.ctx.lineTo(chartZone[0], height)
      this.ctx.stroke()
      // 绘制辅助线
      if (index === 0) return // 排除x轴
      this.ctx.beginPath()
      this.ctx.strokeStyle = '#eaeaea'
      this.ctx.moveTo(chartZone[0], height)
      this.ctx.lineTo(chartZone[2], height)
      this.ctx.stroke()
    })
  }

  /**
   * 绘制x轴坐标
   */
  drawXLabels () {
    const { xAxisLabel, chartZone } = this.options
    const labels = xAxisLabel
    const xLength = chartZone[2] - chartZone[0]
    const gap = xLength / labels.length // 坐标点之间的间隔

    labels.forEach((label, index) => {
      const width = chartZone[0] + index * gap
      if (index % 4 === 0) {
        this.ctx.strokeStyle = '#eaeaea'
        this.ctx.font = '18px'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(label, width, chartZone[3] + 16)
      }
      // 绘制小间隔
      this.ctx.beginPath()
      this.ctx.strokeStyle = '#353535'
      this.ctx.moveTo(width, chartZone[3])
      this.ctx.lineTo(width, chartZone[3] + 5)
      this.ctx.stroke()
    })
  }

  /**
   * 绘制数据
   */
  drawData () {
    const { data, chartZone, xAxisLabel } = this.options
    const xLength = chartZone[2] - chartZone[0]
    const gap = xLength / xAxisLabel.length
    const openingPriceCoords = []
    const closingPriceCoords = []

    data.forEach((item, index) => {
      // 获取绘图颜色
      const color = this.getColor(item)
      this.ctx.strokeStyle = this.ctx.fillStyle = color
      // 计算绘制中心点x坐标
      const activeX = chartZone[0] + index * gap
      // 绘制最高最低线;
      this.ctx.beginPath()
      this.ctx.moveTo(activeX, this.transYValueToYCoord(item[2]))
      this.ctx.lineTo(activeX, this.transYValueToYCoord(item[3]))
      this.ctx.closePath()
      this.ctx.stroke()

      const openingPrice = this.transYValueToYCoord(item[0]) // 开盘价
      const closingPrice = this.transYValueToYCoord(item[1]) // 收盘价
      openingPriceCoords.push([activeX, openingPrice])
      closingPriceCoords.push([activeX, closingPrice])

      // 绘制开盘收盘矩形
      if (item[0] >= item[1]) {
        this.ctx.fillRect(activeX - 5, openingPrice, 10, closingPrice - openingPrice)
      } else {
        this.ctx.fillRect(activeX - 5, closingPrice, 10, openingPrice - closingPrice)
      }
    })

    // 绘制曲线图
    // drawCurve(openingPriceCoords, '#f9bb2d') // 开盘价曲线图
    this.drawCurve(closingPriceCoords, 'blue') // 收盘价曲线图
  }

  /**
   * 绘制曲线图
   */
  drawCurve (data, style) {
    let lastPoint = data[0] // 缓存上一条线的终点

    let index = 1
    const step = () => {
      const item = data[index]

      const ctrlPoint = item // 当前数据点为本条线的控制点
      const next = data[index + 1] || item
      // 计算每段曲线终点
      const nextPoint = [(item[0] + next[0]) / 2, (item[1] + next[1]) / 2] // 两个数据点的中点
      const nextPoin2 = [(nextPoint[0] + next[0]) / 2, (nextPoint[1] + next[1]) / 2]

      this.ctx.beginPath()
      this.ctx.moveTo(...lastPoint)
      this.ctx.quadraticCurveTo(
        ...ctrlPoint,
        ...nextPoin2
      )
      this.ctx.strokeStyle = style
      this.ctx.stroke()
      lastPoint = nextPoin2

      if (index < data.length - 1) {
        index++
        requestAnimationFrame(step)
      }
    }

    step()
  }

  /**
   * 根据K线图的数据计算绘图颜色
   */
  getColor (data) {
    return data[0] >= data[1] ? '#1abc9c' : '#DA5961'
  }

  /**
   * 从可视坐标系坐标转换为canvas坐标系坐标
   * 数学公式转换
   */
  transYValueToYCoord (yValue) {
    const { chartZone, yMin, yMax } = this.options
    return chartZone[3] - (chartZone[3] - chartZone[1]) * (yValue - yMin) / (yMax - yMin)
  }

  /**
   * 根据canvas坐标系y坐标获取可视坐标系y坐标
   * 数学公式转换
   */
  transYCoordToYValue (yCoord) {
    const { chartZone, yMin, yMax } = this.options
    return ((yMax - yMin) * (chartZone[3] - yCoord) / (chartZone[3] - chartZone[1]) + yMin).toFixed(2)
  }

  /**
   * 根据canvas坐标系x坐标获取可视坐标系x坐标
   * 数学公式转换
   */
  transXCoordToXValue (xCoord) {
    const { chartZone, xAxisLabel } = this.options
    const labels = xAxisLabel
    const xLength = chartZone[2] - chartZone[0]
    const gap = xLength / labels.length // 坐标点之间的间隔
    const index = Math.round((xCoord - chartZone[0]) / gap)
    return {
      index,
      value: labels[index]
    }
  }

  render () {
    this.drawAxis()
    this.drawYLabels()
    this.drawXLabels()
    this.drawData()
  }
}

const chart = new KChart({
  id: document.getElementById('background-layer'),
  // 时间 开盘价 收盘价 最低价 最高价
  data: [
    ['2013/4/7', 2232.69, 2225.29, 2217.25, 2241.34],
    ['2013/4/8', 2196.24, 2211.59, 2180.67, 2212.59],
    ['2013/4/9', 2215.47, 2225.77, 2215.47, 2234.73],
    ['2013/4/10', 2224.93, 2226.13, 2212.56, 2233.04],
    ['2013/4/11', 2236.98, 2219.55, 2217.26, 2242.48],
    ['2013/4/12', 2218.09, 2206.78, 2204.44, 2226.26],
    ['2013/4/13', 2199.91, 2181.94, 2177.39, 2204.99],
    ['2013/4/14', 2169.63, 2194.85, 2165.78, 2196.43],
    ['2013/4/15', 2195.03, 2193.8, 2178.47, 2197.51],
    ['2013/4/16', 2181.82, 2197.6, 2175.44, 2206.03],
    ['2013/4/17', 2201.12, 2244.64, 2200.58, 2250.11],
    ['2013/4/18', 2236.4, 2242.17, 2232.26, 2245.12],
    ['2013/4/19', 2242.62, 2184.54, 2182.81, 2242.62],
    ['2013/4/20', 2187.35, 2218.32, 2184.11, 2226.12],
    ['2013/4/21', 2213.19, 2199.31, 2191.85, 2224.63],
    ['2013/4/22', 2203.89, 2177.91, 2173.86, 2210.58],
    ['2013/4/23', 2170.78, 2174.12, 2161.14, 2179.65],
    ['2013/4/24', 2179.05, 2205.5, 2179.05, 2222.81],
    ['2013/4/25', 2212.5, 2231.17, 2212.5, 2236.07],
    ['2013/4/26', 2227.86, 2235.57, 2219.44, 2240.26],
    ['2013/4/27', 2242.39, 2246.3, 2235.42, 2255.21],
    ['2013/4/28', 2246.96, 2232.97, 2221.38, 2247.86],
    ['2013/4/29', 2228.82, 2246.83, 2225.81, 2247.67],
    ['2013/4/30', 2247.68, 2241.92, 2231.36, 2250.85],
    ['2013/5/1', 2238.9, 2217.01, 2205.87, 2239.93],
    ['2013/5/2', 2217.09, 2224.8, 2213.58, 2225.19],
    ['2013/5/3', 2221.34, 2251.81, 2210.77, 2252.87],
    ['2013/5/4', 2249.81, 2282.87, 2248.41, 2288.09],
    ['2013/5/5', 2286.33, 2299.99, 2281.9, 2309.39],
    ['2013/5/6', 2297.11, 2305.11, 2290.12, 2305.3],
    ['2013/5/7', 2303.75, 2302.4, 2292.43, 2314.18],
    ['2013/5/8', 2293.81, 2275.67, 2274.1, 2304.95],
    ['2013/5/9', 2281.45, 2288.53, 2270.25, 2292.59],
    ['2013/5/10', 2286.66, 2293.08, 2283.94, 2301.7],
    ['2013/5/11', 2293.4, 2321.32, 2281.47, 2322.1],
    ['2013/5/12', 2323.54, 2324.02, 2321.17, 2334.33],
    ['2013/5/13', 2316.25, 2317.75, 2310.49, 2325.72],
    ['2013/5/14', 2320.74, 2300.59, 2299.37, 2325.53],
    ['2013/5/15', 2300.21, 2299.25, 2294.11, 2313.43],
    ['2013/5/16', 2297.1, 2272.42, 2264.76, 2297.1],
    ['2013/5/17', 2270.71, 2270.93, 2260.87, 2276.86],
    ['2013/5/18', 2264.43, 2242.11, 2240.07, 2266.69],
    ['2013/5/18', 2242.26, 2210.9, 2205.07, 2250.63],
    ['2013/5/20', 2190.1, 2148.35, 2126.22, 2190.1],
    ['2013/5/21', 2290.1, 2248.35, 2226.22, 2290.1]
  ]
})
